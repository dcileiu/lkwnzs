import path from "node:path"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

dotenv.config({ path: path.join(process.cwd(), ".env") })
dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true })

const prisma = new PrismaClient()

async function updateTable(table, column) {
  const sql = `
    UPDATE "${table}"
    SET "${column}" = REPLACE("${column}", '.wepb', '.webp')
    WHERE lower("${column}") LIKE '%.wepb%'
  `
  return prisma.$executeRawUnsafe(sql)
}

async function main() {
  const tasks = [
    ["Elf", "avatar"],
    ["Elf", "eggImageUrl"],
    ["Elf", "fruitImageUrl"],
    ["ElfImage", "url"],
    ["Egg", "avatar"],
    ["EggImage", "url"],
    ["Article", "thumbnail"],
    ["Article", "content"],
  ]

  const result = {}

  for (const [table, column] of tasks) {
    result[`${table}.${column}`] = await updateTable(table, column)
  }

  console.log(".wepb -> .webp 修复完成：")
  for (const [key, count] of Object.entries(result)) {
    console.log(`${key}: ${count}`)
  }
}

main()
  .catch((error) => {
    console.error("修复失败：", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
