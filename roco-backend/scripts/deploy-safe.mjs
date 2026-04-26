import fs from "node:fs/promises"
import path from "node:path"
import { spawn } from "node:child_process"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

dotenv.config({ path: path.join(process.cwd(), ".env") })
dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true })

const BACKUP_DIR = path.join(process.cwd(), "prisma", "backups")
const KEEP_BACKUPS = 30
const NESTED_PRISMA_DIR = path.join(process.cwd(), "prisma", "prisma")

const FLAGS = new Set(process.argv.slice(2))
const SHOULD_SEED = FLAGS.has("--seed")
const SHOULD_BUILD = !FLAGS.has("--no-build")
const SKIP_PUSH = FLAGS.has("--no-db-push")

function timestamp() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, "0")
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("")
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function getConnectedDatabasePath() {
  const prisma = new PrismaClient()

  try {
    await prisma.$executeRawUnsafe("PRAGMA wal_checkpoint(FULL)")
    const rows = await prisma.$queryRawUnsafe("PRAGMA database_list")
    const mainDb = rows.find((row) => row.name === "main")
    return typeof mainDb?.file === "string" ? mainDb.file : ""
  } finally {
    await prisma.$disconnect()
  }
}

async function backupDatabase(databasePath) {
  await fs.mkdir(BACKUP_DIR, { recursive: true })

  const backupBasePath = path.join(BACKUP_DIR, `dev.db.${timestamp()}.bak`)
  await fs.copyFile(databasePath, backupBasePath)

  for (const suffix of ["-wal", "-shm"]) {
    const sidecarPath = `${databasePath}${suffix}`
    if (await pathExists(sidecarPath)) {
      await fs.copyFile(sidecarPath, `${backupBasePath}${suffix}`)
    }
  }

  return backupBasePath
}

async function pruneOldBackups(keep) {
  const entries = await fs.readdir(BACKUP_DIR).catch(() => [])
  const baseBackups = entries
    .filter((name) => /^dev\.db\.\d{8}-\d{6}\.bak$/.test(name))
    .sort()

  if (baseBackups.length <= keep) return

  const toDelete = baseBackups.slice(0, baseBackups.length - keep)
  for (const name of toDelete) {
    const fullPath = path.join(BACKUP_DIR, name)
    await fs.unlink(fullPath).catch(() => {})
    for (const suffix of ["-wal", "-shm"]) {
      await fs.unlink(`${fullPath}${suffix}`).catch(() => {})
    }
  }

  if (toDelete.length > 0) {
    console.log(`已清理 ${toDelete.length} 个旧备份，仅保留最近 ${keep} 个。`)
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      shell: true,
      stdio: "inherit",
    })

    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`))
    })
  })
}

function printHeader() {
  console.log("============================================================")
  console.log("  Roco Backend 安全部署")
  console.log("============================================================")
  console.log(`  种子/导入数据：${SHOULD_SEED ? "开启 (--seed)" : "跳过（默认）"}`)
  console.log(`  数据库 schema 同步：${SKIP_PUSH ? "跳过 (--no-db-push)" : "执行"}`)
  console.log(`  Next.js 构建：${SHOULD_BUILD ? "执行" : "跳过 (--no-build)"}`)
  console.log("------------------------------------------------------------")
}

async function checkDatabaseUrl() {
  const url = process.env.DATABASE_URL || ""
  if (!url) {
    throw new Error(".env 中没有读取到 DATABASE_URL，请先配置后再部署。")
  }

  const match = url.match(/^file:(.+)$/)
  if (!match) return

  const target = match[1].trim()
  if (target.startsWith("./prisma/") || target.startsWith("prisma/")) {
    throw new Error(
      [
        `检测到 DATABASE_URL = ${url}`,
        "Prisma 解析 SQLite 相对路径时是相对于 schema.prisma（即 prisma/ 目录），",
        "因此 'file:./prisma/xxx' 会被展开成 prisma/prisma/xxx，导致出现嵌套目录。",
        "请把 .env 改成下列任一种正确写法后再部署：",
        '  DATABASE_URL="file:./dev.db"',
        '  DATABASE_URL="file:/www/wwwroot/roco-backend/prisma/dev.db"',
      ].join("\n  "),
    )
  }
}

async function checkNestedPrismaDir() {
  if (!(await pathExists(NESTED_PRISMA_DIR))) return

  console.warn("")
  console.warn("⚠️  检测到嵌套目录：prisma/prisma/")
  console.warn("    通常是早先 DATABASE_URL 写成 file:./prisma/xxx 导致 Prisma 自己创建出来的。")
  console.warn(`    请确认 ${NESTED_PRISMA_DIR} 里没有真正在用的数据，然后手动删除该目录：`)
  console.warn(`        rm -rf ${NESTED_PRISMA_DIR}`)
  console.warn("    若你不确定，可以先把它移到备份目录：")
  console.warn(`        mv ${NESTED_PRISMA_DIR} ${path.join(BACKUP_DIR, "nested-prisma." + timestamp())}`)
  console.warn("")
}

async function main() {
  printHeader()

  await checkDatabaseUrl()
  await checkNestedPrismaDir()

  const databasePath = await getConnectedDatabasePath()
  if (!databasePath) {
    throw new Error("无法读取当前 Prisma 连接的 SQLite 文件路径，请检查 .env 中的 DATABASE_URL。")
  }

  console.log(`数据库路径：${databasePath}`)

  if (await pathExists(databasePath)) {
    const backupPath = await backupDatabase(databasePath)
    console.log(`已备份数据库：${backupPath}`)
    await pruneOldBackups(KEEP_BACKUPS)
  } else {
    console.warn("提示：数据库文件不存在，将在 prisma db push 时由 Prisma 创建。")
  }

  await runCommand("npx", ["prisma", "generate"])

  if (!SKIP_PUSH) {
    await runCommand("npx", ["prisma", "db", "push", "--skip-generate"])
  }

  if (SHOULD_SEED) {
    console.warn("")
    console.warn("⚠️  即将运行种子/导入脚本，会用 data/*.json 的内容覆盖数据库里同名记录的字段。")
    console.warn("    （只影响精灵、道具、蛋组等静态数据；用户、评论、收藏、文章等不会动。）")
    console.warn("")
    await runCommand("npm", ["run", "db:bootstrap"])
    await runCommand("npm", ["run", "db:sync-egg-media"])
    await runCommand("npm", ["run", "db:normalize-image-paths"])
    await runCommand("npm", ["run", "db:import-daoju"])
  } else {
    console.log("已跳过种子/导入脚本。如需同步 JSON 静态数据，请改用：npm run deploy:safe -- --seed")
  }

  if (SHOULD_BUILD) {
    await runCommand("npm", ["run", "build"])
  }

  console.log("")
  console.log("============================================================")
  console.log("  部署完成。请检查线上功能后再 pm2 restart 后端进程。")
  console.log("============================================================")
}

main().catch((error) => {
  console.error("部署失败：", error instanceof Error ? error.message : error)
  process.exitCode = 1
})
