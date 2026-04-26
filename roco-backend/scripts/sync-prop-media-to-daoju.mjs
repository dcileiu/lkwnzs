import fs from "node:fs/promises"
import path from "node:path"

const DATA_FILE = path.join(process.cwd(), "data", "daoju.json")
const DEFAULT_ASSET_DIR = path.join(process.cwd(), "data", "imgs", "prop")
const DEFAULT_PUBLIC_BASE = "/imgs/prop"

function parseArgs() {
  const args = process.argv.slice(2)
  const result = {
    assetDir: DEFAULT_ASSET_DIR,
    publicBase: DEFAULT_PUBLIC_BASE,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === "--asset-dir") {
      const next = args[index + 1]
      if (!next) {
        throw new Error("缺少资源目录，请使用 --asset-dir <目录>")
      }
      result.assetDir = path.resolve(process.cwd(), next)
      index += 1
      continue
    }

    if (arg === "--public-base") {
      const next = args[index + 1]
      if (!next) {
        throw new Error("缺少公开路径前缀，请使用 --public-base <路径>")
      }
      result.publicBase = normalizePublicPath(next)
      index += 1
      continue
    }

    throw new Error(`未知参数：${arg}`)
  }

  return result
}

function normalizePublicPath(value) {
  const normalized = String(value ?? "").trim().replace(/\\/g, "/").replace(/\/+$/g, "")
  return normalized.startsWith("/") ? normalized : `/${normalized}`
}

function sanitizeFileName(name, fallback = "未命名") {
  const sanitized = String(name ?? "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, "")
    .trim()

  return sanitized || fallback
}

function buildCategoryFolder(category, index) {
  const id = sanitizeFileName(category?.id, `category-${index + 1}`)
  const name = sanitizeFileName(category?.name, id)

  return id === name ? id : `${id}-${name}`
}

function buildUniqueBaseName(item, index, usedNames) {
  const baseName = sanitizeFileName(item?.name, `道具-${index + 1}`)
  const usedCount = usedNames.get(baseName) || 0
  usedNames.set(baseName, usedCount + 1)

  return usedCount > 0 ? `${baseName}-${usedCount + 1}` : baseName
}

function getExtensionFromUrl(url) {
  try {
    const ext = path.extname(new URL(url).pathname)
    if (ext) return ext
  } catch {
    // Ignore URL parsing failure and fall back to png.
  }

  return ".png"
}

async function getDownloadedExtension(assetDir, categoryFolder, baseName, fallbackExt) {
  const categoryDir = path.join(assetDir, categoryFolder)

  try {
    const entries = await fs.readdir(categoryDir)
    const matched = entries.find((entry) => path.parse(entry).name === baseName)
    if (matched) {
      return path.extname(matched) || fallbackExt
    }
  } catch {
    // The image may not have been downloaded yet; keep the deterministic URL extension.
  }

  return fallbackExt
}

async function main() {
  const options = parseArgs()
  const content = await fs.readFile(DATA_FILE, "utf8")
  const categories = JSON.parse(content)

  if (!Array.isArray(categories)) {
    throw new Error("data/daoju.json 必须是数组。")
  }

  let updatedCount = 0
  let skippedCount = 0

  for (const [categoryIndex, category] of categories.entries()) {
    const categoryFolder = buildCategoryFolder(category, categoryIndex)
    const items = Array.isArray(category?.items) ? category.items : []
    const usedNames = new Map()

    for (const [itemIndex, item] of items.entries()) {
      if (!item || typeof item !== "object") {
        skippedCount += 1
        continue
      }

      const image = typeof item.image === "string" ? item.image.trim() : ""
      if (!image) {
        skippedCount += 1
        continue
      }

      const baseName = buildUniqueBaseName(item, itemIndex, usedNames)
      const fallbackExt = /^https?:\/\//i.test(image) ? getExtensionFromUrl(image) : path.extname(image) || ".png"
      const ext = await getDownloadedExtension(options.assetDir, categoryFolder, baseName, fallbackExt)
      const nextImage = `${options.publicBase}/${categoryFolder}/${baseName}${ext}`.replace(/\\/g, "/")

      if (item.image === nextImage) {
        skippedCount += 1
        continue
      }

      item.image = nextImage
      updatedCount += 1
    }
  }

  await fs.writeFile(DATA_FILE, `${JSON.stringify(categories, null, 4)}\n`)

  console.log("daoju.json 图片路径同步完成。")
  console.log(`更新 ${updatedCount} 条，跳过 ${skippedCount} 条。`)
  console.log(`公开路径前缀：${options.publicBase}`)
  console.log(`资源目录：${options.assetDir}`)
}

main().catch((error) => {
  console.error("同步失败：", error instanceof Error ? error.message : error)
  process.exitCode = 1
})
