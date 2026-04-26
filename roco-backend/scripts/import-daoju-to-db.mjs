import fs from "node:fs/promises"
import path from "node:path"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

dotenv.config({ path: path.join(process.cwd(), ".env") })
dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true })

const prisma = new PrismaClient()
const DAOJU_FILE = path.join(process.cwd(), "data", "daoju.json")

const COMMON_FIELDS = [
  {
    key: "name",
    label: "名称",
    type: "text",
    required: true,
    placeholder: "输入道具名称",
  },
  {
    key: "image",
    label: "图片",
    type: "image",
    required: false,
    placeholder: "/imgs/props/category/name.png",
  },
  {
    key: "rarity",
    label: "品质",
    type: "select",
    required: false,
    options: ["普通", "稀有", "史诗", "传说"],
  },
  {
    key: "attr",
    label: "属性",
    type: "text",
    required: false,
    placeholder: "例如：草 / 火 / 水",
  },
  {
    key: "effect",
    label: "效果",
    type: "textarea",
    required: false,
    placeholder: "输入道具效果",
  },
  {
    key: "obtain",
    label: "获取方式",
    type: "textarea",
    required: false,
    placeholder: "输入获取方式",
  },
  {
    key: "desc",
    label: "描述",
    type: "textarea",
    required: false,
    placeholder: "输入道具描述",
  },
]

const CATEGORY_EXTRA_FIELDS = {
  skill_stone: [
    {
      key: "learnableElves",
      label: "可学精灵",
      type: "elf-multi-select",
      required: false,
      placeholder: "选择可以学习该技能石的精灵",
    },
  ],
}

function stripBom(content) {
  return content.replace(/^\uFEFF/, "")
}

async function readDaojuData() {
  const content = await fs.readFile(DAOJU_FILE, "utf8")
  const parsed = JSON.parse(stripBom(content))

  if (!Array.isArray(parsed)) {
    throw new Error("data/daoju.json 必须是数组。")
  }

  return parsed
}

function toNullableString(value) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed || null
}

function getExtraJson(item) {
  const knownKeys = new Set([
    "name",
    "image",
    "desc",
    "rarity",
    "effect",
    "obtain",
    "attr",
    "learnableElves",
  ])
  const extra = {}

  for (const [key, value] of Object.entries(item)) {
    if (!knownKeys.has(key)) {
      extra[key] = value
    }
  }

  return Object.keys(extra).length > 0 ? JSON.stringify(extra) : null
}

function getCategoryFields(categoryId) {
  return [
    ...COMMON_FIELDS,
    ...(CATEGORY_EXTRA_FIELDS[categoryId] || []),
  ]
}

async function syncCategoryFields(categoryId) {
  const fields = getCategoryFields(categoryId)

  for (const [index, field] of fields.entries()) {
    await prisma.itemCategoryField.upsert({
      where: {
        categoryId_key: {
          categoryId,
          key: field.key,
        },
      },
      create: {
        categoryId,
        key: field.key,
        label: field.label,
        type: field.type,
        required: Boolean(field.required),
        placeholder: field.placeholder || null,
        optionsJson: field.options ? JSON.stringify(field.options) : null,
        sortOrder: index,
      },
      update: {
        label: field.label,
        type: field.type,
        required: Boolean(field.required),
        placeholder: field.placeholder || null,
        optionsJson: field.options ? JSON.stringify(field.options) : null,
        sortOrder: index,
      },
    })
  }
}

async function syncSkillStoneRelations(itemRecord, sourceItem, elfByName) {
  await prisma.skillStoneLearnableElf.deleteMany({
    where: { itemId: itemRecord.id },
  })

  const learnableElves = Array.isArray(sourceItem.learnableElves)
    ? sourceItem.learnableElves
    : []
  let createdCount = 0
  let missingCount = 0

  for (const [index, elf] of learnableElves.entries()) {
    const elfName = typeof elf?.name === "string" ? elf.name.trim() : ""
    const dbElf = elfByName.get(elfName)

    if (!dbElf) {
      missingCount += 1
      continue
    }

    await prisma.skillStoneLearnableElf.create({
      data: {
        itemId: itemRecord.id,
        elfId: dbElf.id,
        sortOrder: index,
      },
    })
    createdCount += 1
  }

  return { createdCount, missingCount }
}

async function main() {
  const categories = await readDaojuData()
  const elves = await prisma.elf.findMany({
    select: { id: true, name: true },
  })
  const elfByName = new Map(elves.map((elf) => [elf.name, elf]))

  let categoryCount = 0
  let itemCount = 0
  let relationCount = 0
  let missingRelationElfCount = 0

  for (const [categoryIndex, category] of categories.entries()) {
    const categoryId = String(category?.id ?? "").trim()
    const categoryName = String(category?.name ?? "").trim()
    const items = Array.isArray(category?.items) ? category.items : []

    if (!categoryId || !categoryName) {
      continue
    }

    await prisma.itemCategory.upsert({
      where: { id: categoryId },
      create: {
        id: categoryId,
        name: categoryName,
        icon: toNullableString(category.icon),
        description: toNullableString(category.description),
        sortOrder: categoryIndex,
      },
      update: {
        name: categoryName,
        icon: toNullableString(category.icon),
        description: toNullableString(category.description),
        sortOrder: categoryIndex,
      },
    })
    await syncCategoryFields(categoryId)
    categoryCount += 1

    for (const [itemIndex, item] of items.entries()) {
      const itemName = String(item?.name ?? "").trim()
      if (!itemName) continue

      const itemRecord = await prisma.item.upsert({
        where: {
          categoryId_name: {
            categoryId,
            name: itemName,
          },
        },
        create: {
          categoryId,
          name: itemName,
          image: toNullableString(item.image),
          desc: toNullableString(item.desc),
          rarity: toNullableString(item.rarity),
          effect: toNullableString(item.effect),
          obtain: toNullableString(item.obtain),
          attr: toNullableString(item.attr),
          extraJson: getExtraJson(item),
          sortOrder: itemIndex,
        },
        update: {
          image: toNullableString(item.image),
          desc: toNullableString(item.desc),
          rarity: toNullableString(item.rarity),
          effect: toNullableString(item.effect),
          obtain: toNullableString(item.obtain),
          attr: toNullableString(item.attr),
          extraJson: getExtraJson(item),
          sortOrder: itemIndex,
        },
      })
      itemCount += 1

      if (categoryId === "skill_stone") {
        const relationResult = await syncSkillStoneRelations(itemRecord, item, elfByName)
        relationCount += relationResult.createdCount
        missingRelationElfCount += relationResult.missingCount
      }
    }
  }

  console.log("daoju.json 已导入数据库。")
  console.log(`分类：${categoryCount} 个，道具：${itemCount} 个。`)
  console.log(`技能石可学精灵关系：${relationCount} 条。`)
  console.log(`未匹配到数据库精灵的关系：${missingRelationElfCount} 条。`)
}

main()
  .catch((error) => {
    console.error("导入失败：", error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
