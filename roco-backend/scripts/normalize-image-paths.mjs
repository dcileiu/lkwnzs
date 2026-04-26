import path from "node:path"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

dotenv.config({ path: path.join(process.cwd(), ".env") })
dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true })

const prisma = new PrismaClient()
const CDN_HOST_PATTERN = /https?:\/\/[^/"'\s)]+\.cdn\.itianci\.cn/gi

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
]

async function normalizeField(table, column) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT "id", "${column}" AS "value" FROM "${table}" WHERE "${column}" IS NOT NULL`
  )
  let updatedCount = 0

  for (const row of rows) {
    const currentValue = typeof row.value === "string" ? row.value : ""
    const nextValue = currentValue
      .replace(CDN_HOST_PATTERN, "")
      .replace(/\.wepb(\?|#|$)/gi, ".webp$1")

    if (nextValue === currentValue) continue

    await prisma.$executeRawUnsafe(
      `UPDATE "${table}" SET "${column}" = ? WHERE "id" = ?`,
      nextValue,
      row.id
    )
    updatedCount += 1
  }

  return updatedCount
}

async function main() {
  const result = {}

  for (const [table, column] of imageFields) {
    result[`${table}.${column}`] = await normalizeField(table, column)
  }

  console.log("图片字段归一化完成（保留用户、评论、收藏、点赞等业务数据）：")
  for (const [key, count] of Object.entries(result)) {
    console.log(`${key}: ${count}`)
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
