import fs from "node:fs/promises"
import path from "node:path"

const JINGLING_FILE = path.join(process.cwd(), "data", "jingling.json")
const EGG_ASSET_DIR = path.join(process.cwd(), "data", "imgs", "eggs")
const CDN_BASE_URL = "https://roco.cdn.itianci.cn/imgs/jingling"

async function loadJsonArray(filePath) {
  const content = await fs.readFile(filePath, "utf8")
  const parsed = JSON.parse(content)

  if (!Array.isArray(parsed)) {
    throw new Error(`${path.basename(filePath)} 必须是数组。`)
  }

  return { content, parsed }
}

function buildAssetMap(fileNames) {
  const assetMap = new Map()

  for (const fileName of fileNames) {
    const ext = path.extname(fileName)
    const baseName = path.basename(fileName, ext)

    if (baseName.endsWith("蛋")) {
      assetMap.set(`${baseName.slice(0, -1)}::egg`, fileName)
      continue
    }

    if (baseName.endsWith("果实")) {
      assetMap.set(`${baseName.slice(0, -2)}::fruit`, fileName)
    }
  }

  return assetMap
}

function buildCdnUrl(fileName) {
  return `${CDN_BASE_URL}/${fileName}`
}

async function main() {
  const [{ content, parsed: jingling }, eggAssetEntries] = await Promise.all([
    loadJsonArray(JINGLING_FILE),
    fs.readdir(EGG_ASSET_DIR, { withFileTypes: true }),
  ])

  const fileNames = eggAssetEntries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)

  const assetMap = buildAssetMap(fileNames)
  const eol = content.includes("\r\n") ? "\r\n" : "\n"
  const hasTrailingNewline = content.endsWith("\r\n") || content.endsWith("\n")

  let updatedCount = 0
  let eggCount = 0
  let fruitCount = 0

  for (const elf of jingling) {
    const name = String(elf?.name ?? "").trim()
    if (!name) continue

    const eggFileName = assetMap.get(`${name}::egg`)
    const fruitFileName = assetMap.get(`${name}::fruit`)

    const nextEggImageUrl = eggFileName ? buildCdnUrl(eggFileName) : undefined
    const nextFruitImageUrl = fruitFileName ? buildCdnUrl(fruitFileName) : undefined
    const beforeEgg = elf.eggImageUrl
    const beforeFruit = elf.fruitImageUrl

    if (nextEggImageUrl) {
      elf.eggImageUrl = nextEggImageUrl
      eggCount += 1
    } else if ("eggImageUrl" in elf) {
      delete elf.eggImageUrl
    }

    if (nextFruitImageUrl) {
      elf.fruitImageUrl = nextFruitImageUrl
      fruitCount += 1
    } else if ("fruitImageUrl" in elf) {
      delete elf.fruitImageUrl
    }

    if (beforeEgg !== elf.eggImageUrl || beforeFruit !== elf.fruitImageUrl) {
      updatedCount += 1
    }
  }

  let nextContent = JSON.stringify(jingling, null, 2)
  if (eol === "\r\n") {
    nextContent = nextContent.replace(/\n/g, "\r\n")
  }
  if (hasTrailingNewline) {
    nextContent += eol
  }

  await fs.writeFile(JINGLING_FILE, nextContent, "utf8")

  console.log("jingling.json 已同步精灵蛋/果实图片字段。")
  console.log(`更新 ${updatedCount} 条精灵，蛋图 ${eggCount} 条，果实图 ${fruitCount} 条。`)
}

main().catch((error) => {
  console.error("同步失败：", error instanceof Error ? error.message : error)
  process.exitCode = 1
})
