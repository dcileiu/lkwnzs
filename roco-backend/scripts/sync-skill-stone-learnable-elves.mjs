import fs from "node:fs/promises"
import path from "node:path"

const DAOJU_FILE = path.join(process.cwd(), "data", "daoju.json")
const JINGLING_FILE = path.join(process.cwd(), "data", "jingling.json")

function stripBom(content) {
  return content.replace(/^\uFEFF/, "")
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8")
  return JSON.parse(stripBom(content))
}

async function findSkillStoneMappingFile() {
  const files = await fs.readdir(path.join(process.cwd(), "data"))
  const file = files.find((name) => name.includes("技能石") && name.endsWith(".json"))

  if (!file) {
    throw new Error("未找到 技能石 对应可学精灵的 JSON 文件。")
  }

  return path.join(process.cwd(), "data", file)
}

function normalizeNo(value) {
  const raw = String(value ?? "").trim()
  if (!raw) return ""

  return raw.startsWith("NO.") ? raw : `NO.${raw.padStart(3, "0")}`
}

function buildElfPayload(elf) {
  const attrNames = Array.isArray(elf.attrNames)
    ? elf.attrNames
    : Array.isArray(elf.attrs)
      ? elf.attrs
      : []

  return {
    no: normalizeNo(elf.no),
    name: elf.name,
    image: elf.image || elf.detailImgUrl || "",
    attrs: attrNames,
    typeName: elf.typeName ?? "",
    formName: elf.formName ?? "",
  }
}

async function main() {
  const [daoju, jingling, mappingFile] = await Promise.all([
    readJson(DAOJU_FILE),
    readJson(JINGLING_FILE),
    findSkillStoneMappingFile(),
  ])
  const skillMappings = await readJson(mappingFile)

  if (!Array.isArray(daoju)) {
    throw new Error("data/daoju.json 必须是数组。")
  }

  if (!Array.isArray(jingling)) {
    throw new Error("data/jingling.json 必须是数组。")
  }

  const jinglingByName = new Map(
    jingling
      .filter((elf) => elf && typeof elf.name === "string")
      .map((elf) => [elf.name, elf]),
  )
  const skillStoneCategory = daoju.find((category) => category?.id === "skill_stone")

  if (!skillStoneCategory || !Array.isArray(skillStoneCategory.items)) {
    throw new Error("data/daoju.json 中未找到 id=skill_stone 的道具分类。")
  }

  let updatedCount = 0
  let emptyMappingCount = 0
  let missingElfCount = 0
  const missingSkillNames = []
  const missingElfNames = new Set()

  for (const item of skillStoneCategory.items) {
    const skillName = String(item?.name ?? "").trim()
    const mappedElves = Array.isArray(skillMappings[skillName])
      ? skillMappings[skillName]
      : []

    if (mappedElves.length === 0) {
      emptyMappingCount += 1
      missingSkillNames.push(skillName)
    }

    const learnableElves = []
    for (const mappedElf of mappedElves) {
      const elf = jinglingByName.get(mappedElf?.name)

      if (!elf) {
        missingElfCount += 1
        missingElfNames.add(mappedElf?.name || "未命名")
        continue
      }

      learnableElves.push(buildElfPayload(elf))
    }

    item.learnableElves = learnableElves
    updatedCount += 1
  }

  await fs.writeFile(DAOJU_FILE, `${JSON.stringify(daoju, null, 4)}\n`, "utf8")

  console.log("技能石可学精灵已同步到 daoju.json。")
  console.log(`技能石条目：${skillStoneCategory.items.length}，更新：${updatedCount}。`)
  console.log(`无映射技能石：${emptyMappingCount} 个。`)
  if (missingSkillNames.length > 0) {
    console.log(`无映射技能石名称：${missingSkillNames.join("、")}`)
  }
  console.log(`映射中找不到 jingling 精灵：${missingElfCount} 条。`)
  if (missingElfNames.size > 0) {
    console.log(`缺失精灵名称：${Array.from(missingElfNames).join("、")}`)
  }
  console.log(`映射文件：${mappingFile}`)
}

main().catch((error) => {
  console.error("同步失败：", error instanceof Error ? error.message : error)
  process.exitCode = 1
})
