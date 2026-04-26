import path from "node:path"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

dotenv.config({ path: path.join(process.cwd(), ".env") })
dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true })

const prisma = new PrismaClient()

// 旧的正则只覆盖 *.cdn.itianci.cn，无法清掉 roco.itianci.cn 这种历史子域。
// 现在改成"所有 itianci.cn 域名族"统一剥掉 host，让数据库里只剩相对路径，
// 运行时再由 resolveImageUrl 用 QINIU_DOMAIN 拼回完整 URL。
const PROJECT_HOST_PATTERN = /https?:\/\/[^/"'\s)]*itianci\.cn/gi

const imageFields = [
  ["User", "avatar"],
  ["Author", "avatar"],
  ["Elf", "avatar"],
  ["Elf", "eggImageUrl"],
  ["Elf", "fruitImageUrl"],
  ["ElfImage", "url"],
  ["Egg", "avatar"],
  ["EggImage", "url"],
  ["Article", "thumbnail"],
  ["Article", "content"],
  ["Article", "contentMarkdown"],
  ["Item", "image"],
  ["EggGroupElf", "image"],
]

async function tableExists(table) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT name FROM sqlite_master WHERE type='table' AND name = ?`,
    table,
  )
  return Array.isArray(rows) && rows.length > 0
}

async function normalizeField(table, column) {
  if (!(await tableExists(table))) {
    return { skipped: true, count: 0 }
  }

  const rows = await prisma.$queryRawUnsafe(
    `SELECT "id", "${column}" AS "value" FROM "${table}" WHERE "${column}" IS NOT NULL`
  )
  let updatedCount = 0

  for (const row of rows) {
    const currentValue = typeof row.value === "string" ? row.value : ""
    const nextValue = currentValue
      .replace(PROJECT_HOST_PATTERN, "")
      .replace(/\.wepb(\?|#|$)/gi, ".webp$1")

    if (nextValue === currentValue) continue

    await prisma.$executeRawUnsafe(
      `UPDATE "${table}" SET "${column}" = ? WHERE "id" = ?`,
      nextValue,
      row.id
    )
    updatedCount += 1
  }

  return { skipped: false, count: updatedCount }
}

async function main() {
  const result = {}
  const skipped = []

  for (const [table, column] of imageFields) {
    const outcome = await normalizeField(table, column)
    if (outcome.skipped) {
      skipped.push(`${table}.${column}`)
      continue
    }
    result[`${table}.${column}`] = outcome.count
  }

  console.log("图片字段归一化完成（保留用户、评论、收藏、点赞等业务数据）：")
  for (const [key, count] of Object.entries(result)) {
    console.log(`  ${key}: ${count}`)
  }

  if (skipped.length) {
    console.log("")
    console.log("以下字段在当前数据库中没有对应表，已自动跳过：")
    for (const key of skipped) {
      console.log(`  - ${key}`)
    }
  }
}

main()
  .catch((error) => {
    console.error("图片字段归一化失败：", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
