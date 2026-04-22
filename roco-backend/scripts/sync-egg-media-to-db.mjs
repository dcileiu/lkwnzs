import fs from "node:fs/promises"
import path from "node:path"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

dotenv.config({ path: path.join(process.cwd(), ".env") })
dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true })

const prisma = new PrismaClient()
const JINGLING_FILE = path.join(process.cwd(), "data", "jingling.json")

async function loadJinglingRecords() {
  const content = await fs.readFile(JINGLING_FILE, "utf8")
  const parsed = JSON.parse(content)

  if (!Array.isArray(parsed)) {
    throw new Error("data/jingling.json 必须是数组。")
  }

  return parsed
}

function normalizeUrl(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

async function main() {
  const records = await loadJinglingRecords()
  const elves = await prisma.elf.findMany({
    select: {
      id: true,
      name: true,
      eggImageUrl: true,
      fruitImageUrl: true,
    },
  })

  const elfByName = new Map(elves.map((elf) => [elf.name, elf]))
  let updatedCount = 0
  let missingCount = 0
  let untouchedCount = 0

  for (const record of records) {
    const name = String(record?.name ?? "").trim()
    if (!name) continue

    const elf = elfByName.get(name)
    if (!elf) {
      missingCount += 1
      continue
    }

    const nextEggImageUrl = normalizeUrl(record?.eggImageUrl)
    const nextFruitImageUrl = normalizeUrl(record?.fruitImageUrl)

    if (elf.eggImageUrl === nextEggImageUrl && elf.fruitImageUrl === nextFruitImageUrl) {
      untouchedCount += 1
      continue
    }

    await prisma.elf.update({
      where: { id: elf.id },
      data: {
        eggImageUrl: nextEggImageUrl,
        fruitImageUrl: nextFruitImageUrl,
      },
    })

    updatedCount += 1
  }

  console.log("jingling.json 中的精灵蛋/果实图片已同步到数据库。")
  console.log(`更新 ${updatedCount} 条，未变化 ${untouchedCount} 条，数据库无对应精灵 ${missingCount} 条。`)
}

main()
  .catch((error) => {
    console.error("同步失败：", error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
