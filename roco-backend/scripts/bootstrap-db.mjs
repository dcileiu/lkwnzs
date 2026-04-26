import fs from "node:fs/promises"
import path from "node:path"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

dotenv.config({ path: path.join(process.cwd(), ".env") })
dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true })

const prisma = new PrismaClient()
const FORCE_BOOTSTRAP = process.argv.includes("--force")

const SAMPLE_AUTHOR_NAME = "洛克助手运营组"
const SAMPLE_ARTICLE_TITLE = "新手开荒指南：前 30 分钟先做这 5 件事"
const CDN_HOSTS = new Set(["wallpaper.cdn.itianci.cn"])

function stripBom(content) {
  return content.replace(/^\uFEFF/, "")
}

function normalizeElementList(input) {
  const rawValues = Array.isArray(input) ? input : [input ?? ""]

  return Array.from(
    new Set(
      rawValues
        .flatMap((value) => String(value).split(/[\/,，、|]/g))
        .map((value) => value.trim())
        .filter(Boolean)
    )
  )
}

function serializeElementList(input) {
  return normalizeElementList(input).join(" / ")
}

function uniqueImageUrls(...urls) {
  return Array.from(
    new Set(
      urls
        .map((url) => normalizeImageUrl(url))
        .filter(Boolean)
    )
  )
}

function normalizeImageUrl(url) {
  if (typeof url !== "string") return ""
  const normalized = url.trim().replace(/\.wepb(\?|#|$)/gi, ".webp$1")
  if (!normalized) return ""
  if (!/^https?:\/\//i.test(normalized)) {
    return normalized.startsWith("/") ? normalized : `/${normalized}`
  }

  try {
    const parsed = new URL(normalized)
    if (!CDN_HOSTS.has(parsed.host.toLowerCase())) {
      return normalized
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return normalized
  }
}

function extractArticleThumbnail(content) {
  const match = content.match(/!\[[^\]]*]\(([^)\s]+)\)/i)
  return match?.[1] || null
}

function extractArticleSummary(content, limit = 140) {
  const plainText = content
    .replace(/!\[[^\]]*]\(([^)]+)\)/g, " ")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1")
    .replace(/[`#>*_~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (!plainText) return null
  return plainText.slice(0, limit)
}

function buildSampleArticleContent() {
  return [
    "![迪莫](/imgs/jingling/迪莫.webp)",
    "",
    "# 新手开荒指南：前 30 分钟先做这 5 件事",
    "",
    "刚进洛克王国时，最怕的不是不会玩，而是把前期资源用在收益很低的地方。下面这篇示例攻略，适合直接放进小程序做新手引导内容。",
    "",
    "## 1. 先把主线和基础引导做完",
    "",
    "主线任务会连续解锁地图、功能入口和基础奖励。前 30 分钟最重要的目标不是练满某一只宠物，而是把能开的功能先全部打开。",
    "",
    "建议优先完成：",
    "",
    "- 新手引导任务",
    "- 首轮主线剧情",
    "- 基础战斗教学",
    "- 常用地图传送点",
    "",
    "## 2. 前期宠物不要分散培养",
    "",
    "很多新手会把经验和材料平均分给好几只宠物，结果谁都不够强。更稳的做法是先确定 1 只主力输出，再补 1 只功能型宠物。",
    "",
    "选择标准很简单：",
    "",
    "- 技能成型快",
    "- 获取门槛低",
    "- 推图稳定",
    "",
    "## 3. 每天先清收益高的固定内容",
    "",
    "如果上线时间不多，优先做有稳定资源回报的内容。金币、基础培养材料和活动代币，这些都会影响后面养成速度。",
    "",
    "推荐日常顺序：",
    "",
    "1. 登录奖励",
    "2. 限时活动",
    "3. 日常任务",
    "4. 资源副本",
    "",
    "## 4. 看到活动先看奖励，再决定投入",
    "",
    "不是每个活动都值得全力刷。判断一个活动值不值得做，先看奖励是不是当前阶段真的需要，比如宠物、技能石、限定道具或高收益材料。",
    "",
    "## 5. 把图鉴和精灵身高体重资料用起来",
    "",
    "如果你的小程序已经录入了精灵图鉴和孵蛋预测数据，前期就能直接用身高体重去缩小范围，减少试错时间。尤其是没有明确蛋来源时，这类信息整理会特别有用。",
    "",
    "## 一句话总结",
    "",
    "先开功能，再养主力，优先做高收益内容。只要前期节奏不乱，后面的养成体验会顺很多。",
  ].join("\n")
}

async function loadElfRecords() {
  const filePath = path.join(process.cwd(), "data", "jingling.json")
  const content = await fs.readFile(filePath, "utf8")
  const parsed = JSON.parse(stripBom(content))

  if (!Array.isArray(parsed)) {
    throw new Error("data/jingling.json 格式不正确，必须是数组。")
  }

  return parsed
}

async function ensureAuthor(name) {
  const existing = await prisma.author.findFirst({
    where: { name },
  })

  if (existing) return existing

  return prisma.author.create({
    data: {
      name,
      bio: "系统预置作者",
    },
  })
}

async function syncElves() {
  const records = await loadElfRecords()
  const existingElves = await prisma.elf.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  const existingByName = new Map(existingElves.map((elf) => [elf.name, elf]))
  let createdCount = 0
  let skippedCount = 0
  let updatedCount = 0

  for (const record of records) {
    const name = String(record.name ?? "").trim()
    if (!name) continue

    const imageUrls = uniqueImageUrls(record.image, record.detailImgUrl)
    const images = imageUrls.map((url, index) => ({
      url,
      sortOrder: index,
      altText: name,
    }))

    const baseData = {
      name,
      avatar: imageUrls[0] ?? null,
      element: serializeElementList(record.attrNames ?? []),
      rarity: String(record.typeName ?? "普通").trim() || "普通",
      category: String(record.typeName ?? "").trim() || null,
      group: null,
      height: typeof record.height === "string" && record.height.trim() ? record.height.trim() : null,
      weight: typeof record.weight === "string" && record.weight.trim() ? record.weight.trim() : null,
      raceValue: null,
      eggImageUrl: normalizeImageUrl(record.eggImageUrl) || null,
      fruitImageUrl: normalizeImageUrl(record.fruitImageUrl) || null,
      tags: JSON.stringify({
        no: record.no ?? "",
        type: record.type ?? "",
        typeName: record.typeName ?? "",
        form: record.form ?? "",
        formName: record.formName ?? "",
      }),
    }

    const existing = existingByName.get(name)

    if (existing) {
      if (!FORCE_BOOTSTRAP) {
        skippedCount += 1
        continue
      }

      await prisma.elf.update({
        where: { id: existing.id },
        data: {
          ...baseData,
          images: {
            deleteMany: {},
            create: images,
          },
        },
      })
      updatedCount += 1
      continue
    }

    await prisma.elf.create({
      data: {
        ...baseData,
        images: {
          create: images,
        },
      },
    })
    createdCount += 1
  }

  return { createdCount, updatedCount, skippedCount, totalSourceCount: records.length }
}

async function ensureSampleArticle() {
  const author = await ensureAuthor(SAMPLE_AUTHOR_NAME)
  const content = buildSampleArticleContent()
  const data = {
    title: SAMPLE_ARTICLE_TITLE,
    category: "新手入门",
    content,
    thumbnail: extractArticleThumbnail(content),
    summary: extractArticleSummary(content),
    isHot: true,
    authorId: author.id,
    readingTime: Math.max(1, Math.ceil(content.length / 400)),
  }

  const existing = await prisma.article.findFirst({
    where: { title: SAMPLE_ARTICLE_TITLE },
    select: { id: true },
  })

  if (existing && !FORCE_BOOTSTRAP) {
    return { created: false, updated: false }
  }

  if (existing) {
    await prisma.article.update({
      where: { id: existing.id },
      data,
    })
    return { created: false, updated: true }
  }

  await prisma.article.create({ data })
  return { created: true, updated: false }
}

async function main() {
  const elfResult = await syncElves()
  const articleResult = await ensureSampleArticle()

  console.log("数据库初始化完成。")
  console.log(`模式：${FORCE_BOOTSTRAP ? "强制覆盖（--force）" : "安全模式（仅新增缺失数据）"}。`)
  console.log(
    `精灵同步：源数据 ${elfResult.totalSourceCount} 条，新增 ${elfResult.createdCount} 条，更新 ${elfResult.updatedCount} 条，跳过 ${elfResult.skippedCount} 条。`
  )
  console.log(
    `示例文章：${articleResult.created ? "已创建" : articleResult.updated ? "已更新" : "已存在，未覆盖"}。`
  )
}

main()
  .catch((error) => {
    console.error("数据库初始化失败：", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
