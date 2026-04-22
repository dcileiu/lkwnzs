import fs from "node:fs/promises"
import path from "node:path"

const DATA_FILE = path.join(process.cwd(), "data", "eggs.json")
const OUTPUT_DIR = path.join(process.cwd(), "data", "imgs", "eggs")

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim())
}

function sanitizeFileName(name) {
  return String(name)
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "")
    .replace(/\s+/g, "")
    .trim()
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

async function loadRecords() {
  const content = await fs.readFile(DATA_FILE, "utf8")
  const parsed = JSON.parse(content)

  if (!Array.isArray(parsed)) {
    throw new Error("data/eggs.json 必须是数组。")
  }

  return parsed
}

async function main() {
  const records = await loadRecords()
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  let downloadedCount = 0
  let skippedCount = 0
  let failedCount = 0

  for (const record of records) {
    const rawName = String(record?.name ?? "").trim()
    const name = sanitizeFileName(rawName)

    if (!name) {
      skippedCount += 1
      continue
    }

    const assets = [
      {
        label: "蛋",
        url: record?.eggImage,
        suffix: "蛋",
      },
      {
        label: "果实",
        url: record?.fruitImage,
        suffix: "果实",
      },
    ]

    for (const asset of assets) {
      if (!isHttpUrl(asset.url)) {
        skippedCount += 1
        continue
      }

      try {
        const probe = await fetch(asset.url, {
          method: "GET",
          headers: {
            "user-agent": "Mozilla/5.0 Codex Egg Asset Downloader",
            "referer": "https://patchwiki.biligame.com/",
          },
        })

        if (!probe.ok) {
          throw new Error(`下载失败: ${probe.status} ${probe.statusText}`)
        }

        const ext = getExtensionFromResponse(probe, asset.url)
        const targetPath = path.join(OUTPUT_DIR, `${name}${asset.suffix}${ext}`)
        const buffer = Buffer.from(await probe.arrayBuffer())
        await fs.writeFile(targetPath, buffer)
        downloadedCount += 1
        console.log(`已保存 ${rawName}${asset.label} -> ${targetPath}`)
      } catch (error) {
        failedCount += 1
        console.error(`下载 ${rawName}${asset.label} 失败:`, error instanceof Error ? error.message : error)
      }
    }
  }

  console.log("")
  console.log(`完成: 下载 ${downloadedCount} 张, 跳过 ${skippedCount} 项, 失败 ${failedCount} 项。`)
  console.log(`输出目录: ${OUTPUT_DIR}`)
}

main().catch((error) => {
  console.error("执行失败:", error instanceof Error ? error.message : error)
  process.exitCode = 1
})
