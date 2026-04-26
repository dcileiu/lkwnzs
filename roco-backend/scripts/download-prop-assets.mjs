import fs from "node:fs/promises"
import path from "node:path"

const DATA_FILE = path.join(process.cwd(), "data", "daoju.json")
const DEFAULT_OUTPUT_DIR = path.join(process.cwd(), "data", "imgs", "prop")

function parseArgs() {
  const args = process.argv.slice(2)
  const result = {
    outputDir: DEFAULT_OUTPUT_DIR,
    force: false,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === "--force") {
      result.force = true
      continue
    }

    if (arg === "--out" || arg === "-o") {
      const next = args[index + 1]
      if (!next) {
        throw new Error("缺少输出目录，请使用 --out <目录>")
      }
      result.outputDir = path.resolve(process.cwd(), next)
      index += 1
      continue
    }

    if (!arg.startsWith("-")) {
      result.outputDir = path.resolve(process.cwd(), arg)
      continue
    }

    throw new Error(`未知参数：${arg}`)
  }

  return result
}

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim())
}

function sanitizeFileName(name, fallback = "未命名") {
  const sanitized = String(name ?? "")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, "")
    .trim()

  return sanitized || fallback
}

function getExtensionFromResponse(response, url) {
  const contentType = response.headers.get("content-type") || ""

  if (contentType.includes("image/webp")) return ".webp"
  if (contentType.includes("image/jpeg")) return ".jpg"
  if (contentType.includes("image/gif")) return ".gif"
  if (contentType.includes("image/svg+xml")) return ".svg"
  if (contentType.includes("image/png")) return ".png"

  try {
    const pathname = new URL(url).pathname
    const ext = path.extname(pathname)
    if (ext) return ext
  } catch {
    // Ignore URL parsing failure and fall back to png.
  }

  return ".png"
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function loadCategories() {
  const content = await fs.readFile(DATA_FILE, "utf8")
  const parsed = JSON.parse(content)

  if (!Array.isArray(parsed)) {
    throw new Error("data/daoju.json 必须是数组。")
  }

  return parsed
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

async function main() {
  const options = parseArgs()
  const categories = await loadCategories()

  let downloadedCount = 0
  let skippedCount = 0
  let failedCount = 0

  for (const [categoryIndex, category] of categories.entries()) {
    const categoryFolder = buildCategoryFolder(category, categoryIndex)
    const categoryDir = path.join(options.outputDir, categoryFolder)
    const items = Array.isArray(category?.items) ? category.items : []
    const usedNames = new Map()

    await fs.mkdir(categoryDir, { recursive: true })

    for (const [itemIndex, item] of items.entries()) {
      const rawName = String(item?.name ?? "").trim()
      const imageUrl = typeof item?.image === "string" ? item.image.trim() : ""

      if (!isHttpUrl(imageUrl)) {
        skippedCount += 1
        console.log(`跳过 ${category?.name ?? categoryFolder}/${rawName || "未命名"}：无远程图片`)
        continue
      }

      try {
        const response = await fetch(imageUrl, {
          method: "GET",
          headers: {
            "user-agent": "Mozilla/5.0 Roco Prop Asset Downloader",
            "referer": "https://patchwiki.biligame.com/",
          },
        })

        if (!response.ok) {
          throw new Error(`下载失败: ${response.status} ${response.statusText}`)
        }

        const ext = getExtensionFromResponse(response, imageUrl)
        const baseName = buildUniqueBaseName(item, itemIndex, usedNames)
        const targetPath = path.join(categoryDir, `${baseName}${ext}`)

        if (!options.force && await pathExists(targetPath)) {
          skippedCount += 1
          console.log(`已存在，跳过 ${rawName} -> ${targetPath}`)
          continue
        }

        const buffer = Buffer.from(await response.arrayBuffer())
        await fs.writeFile(targetPath, buffer)
        downloadedCount += 1
        console.log(`已保存 ${category?.name ?? categoryFolder}/${rawName} -> ${targetPath}`)
      } catch (error) {
        failedCount += 1
        console.error(
          `下载 ${category?.name ?? categoryFolder}/${rawName || "未命名"} 失败:`,
          error instanceof Error ? error.message : error,
        )
      }
    }
  }

  console.log("")
  console.log(`完成: 下载 ${downloadedCount} 张, 跳过 ${skippedCount} 项, 失败 ${failedCount} 项。`)
  console.log(`输出目录: ${options.outputDir}`)
}

main().catch((error) => {
  console.error("执行失败:", error instanceof Error ? error.message : error)
  process.exitCode = 1
})
