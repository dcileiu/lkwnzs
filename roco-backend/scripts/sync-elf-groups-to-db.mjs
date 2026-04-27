import fs from "node:fs/promises"
import path from "node:path"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

dotenv.config({ path: path.join(process.cwd(), ".env") })
dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true })

const prisma = new PrismaClient()
const JINGLING_FILE = path.join(process.cwd(), "data", "jingling.json")

function normalizeName(value) {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .replace(/[－–—]/g, "-")
    .replace(/[（）()]/g, "")
    .toLowerCase()
}

function stripBom(content) {
  return content.replace(/^\uFEFF/, "")
}

function cleanFamilyName(name) {
  return String(name ?? "")
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .trim()
}

function readType(record) {
  return String(record?.type ?? "").trim().toLowerCase()
}

async function readJingling() {
  const content = await fs.readFile(JINGLING_FILE, "utf8")
  const parsed = JSON.parse(stripBom(content))
  if (!Array.isArray(parsed)) {
    throw new Error("data/jingling.json 格式不正确，必须是数组。")
  }
  return parsed
}

function buildFamilyMap(records) {
  const familyByName = new Map()
  let currentFamily = ""
  let lastType = ""
  let lastNo = ""

  for (const record of records) {
    const name = String(record?.name ?? "").trim()
    if (!name) continue

    const no = String(record?.no ?? "").trim()
    const type = readType(record)
    const candidateFamily = cleanFamilyName(name) || name

    if (type === "stage1") {
      currentFamily = candidateFamily
    } else if (no && no === lastNo && currentFamily) {
      // 同编号的多形态，归到同一组
    } else if (type === "stage2") {
      if (!currentFamily || !["stage1", "stage2"].includes(lastType)) {
        currentFamily = candidateFamily
      }
    } else if (type === "final") {
      if (!currentFamily || !["stage1", "stage2"].includes(lastType)) {
        currentFamily = candidateFamily
      }
    } else if (!currentFamily) {
      currentFamily = candidateFamily
    }

    familyByName.set(normalizeName(name), currentFamily || candidateFamily)
    lastType = type
    lastNo = no
  }

  return familyByName
}

async function main() {
  const [jingling, elves] = await Promise.all([
    readJingling(),
    prisma.elf.findMany({
      select: {
        id: true,
        name: true,
        group: true,
      },
    }),
  ])

  const familyByName = buildFamilyMap(jingling)

  let updatedCount = 0
  let unchangedCount = 0
  let unmatchedCount = 0

  for (const elf of elves) {
    const key = normalizeName(elf.name)
    const nextGroup = familyByName.get(key)
    if (!nextGroup) {
      unmatchedCount += 1
      continue
    }

    if ((elf.group ?? "") === nextGroup) {
      unchangedCount += 1
      continue
    }

    await prisma.elf.update({
      where: { id: elf.id },
      data: { group: nextGroup },
    })
    updatedCount += 1
  }

  console.log(`同步完成：共检查 ${elves.length} 只精灵（按 jingling 进化序列分组）。`)
  console.log(`已更新分组 ${updatedCount} 条，原值一致 ${unchangedCount} 条，未匹配 ${unmatchedCount} 条。`)
}

main()
  .catch((error) => {
    console.error("同步精灵分组失败：", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
