import fs from "node:fs/promises"
import path from "node:path"
import { spawn } from "node:child_process"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

dotenv.config({ path: path.join(process.cwd(), ".env") })
dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true })

const EXPECTED_DB_PATH = path.join(process.cwd(), "prisma", "dev.db")
const BACKUP_DIR = path.join(process.cwd(), "prisma", "backups")

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

function normalizeFilePath(filePath) {
  return path.resolve(filePath).replace(/\\/g, "/")
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

async function main() {
  const databasePath = await getConnectedDatabasePath()
  const normalizedDatabasePath = normalizeFilePath(databasePath)
  const normalizedExpectedPath = normalizeFilePath(EXPECTED_DB_PATH)

  if (!databasePath) {
    throw new Error("无法读取当前 Prisma 连接的 SQLite 文件路径。")
  }

  if (normalizedDatabasePath !== normalizedExpectedPath) {
    throw new Error(
      [
        "安全更新已停止：当前连接的数据库不是 prisma/dev.db。",
        `当前：${databasePath}`,
        `期望：${EXPECTED_DB_PATH}`,
        '请先把 .env 改成 DATABASE_URL="file:/www/wwwroot/roco-backend/prisma/dev.db"，再重新执行。',
      ].join("\n")
    )
  }

  if (!(await pathExists(databasePath))) {
    throw new Error(`数据库文件不存在：${databasePath}`)
  }

  const backupPath = await backupDatabase(databasePath)
  console.log(`已备份数据库：${backupPath}`)

  await runCommand("npx", ["prisma", "generate"])
  await runCommand("npx", ["prisma", "db", "push", "--skip-generate"])
  await runCommand("npm", ["run", "db:bootstrap"])
  await runCommand("npm", ["run", "db:sync-egg-media"])
  await runCommand("npm", ["run", "db:normalize-image-paths"])
  await runCommand("npm", ["run", "db:import-daoju"])
  await runCommand("npm", ["run", "build"])

  console.log("安全更新完成。确认线上功能正常后，再重启 PM2 后端进程。")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
