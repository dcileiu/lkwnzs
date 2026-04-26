"use server"

import { revalidatePath } from "next/cache"

import { readCategoriesData, type CategoryTarget, writeCategoriesData } from "@/lib/game-data"
import { prisma } from "@/lib/prisma"

const ITEM_COMMON_FIELDS = [
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
    placeholder: null,
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

function normalizeCategoryId(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_\u4e00-\u9fa5]/g, "")
}

export async function createCategory(formData: FormData) {
  const name = ((formData.get("name") as string | null) ?? "").trim()
  const targetRaw = ((formData.get("target") as string | null) ?? "elf").trim()
  const target = (targetRaw === "item" ? "item" : "elf") as CategoryTarget

  if (!name) {
    throw new Error("分类名称不能为空")
  }

  const categories = await readCategoriesData()
  const id = normalizeCategoryId(name)

  if (!id) {
    throw new Error("分类名称格式无效")
  }

  if (target === "item") {
    const exists = await prisma.itemCategory.findUnique({
      where: { id },
      select: { id: true },
    })

    if (exists) {
      throw new Error("分类已存在")
    }

    await prisma.itemCategory.create({
      data: {
        id,
        name,
        fields: {
          create: ITEM_COMMON_FIELDS.map((field, index) => ({
            key: field.key,
            label: field.label,
            type: field.type,
            required: field.required,
            placeholder: field.placeholder,
            optionsJson: field.options ? JSON.stringify(field.options) : null,
            sortOrder: index,
          })),
        },
      },
    })

    revalidatePath("/dashboard/categories")
    revalidatePath("/dashboard/items")
    return
  }

  const exists = categories.some((category) => category.id === id && category.target === target)

  if (exists) {
    throw new Error("分类已存在")
  }

  await writeCategoriesData([
    ...categories,
    {
      id,
      name,
      target,
    },
  ])

  revalidatePath("/dashboard/categories")
  revalidatePath("/dashboard/elves/new")
  revalidatePath("/dashboard/items")
}

export async function deleteCategory(formData: FormData) {
  const id = ((formData.get("id") as string | null) ?? "").trim()
  const targetRaw = ((formData.get("target") as string | null) ?? "elf").trim()
  const target = (targetRaw === "item" ? "item" : "elf") as CategoryTarget

  if (!id) {
    throw new Error("分类 ID 不能为空")
  }

  if (target === "item") {
    const itemCount = await prisma.item.count({
      where: { categoryId: id },
    })

    if (itemCount > 0) {
      throw new Error("该道具分类下已有道具，不能直接删除")
    }

    await prisma.itemCategory.delete({
      where: { id },
    })

    revalidatePath("/dashboard/categories")
    revalidatePath("/dashboard/items")
    return
  }

  const categories = await readCategoriesData()
  const nextCategories = categories.filter((category) => !(category.id === id && category.target === target))

  await writeCategoriesData(nextCategories)

  revalidatePath("/dashboard/categories")
  revalidatePath("/dashboard/elves/new")
  revalidatePath("/dashboard/items")
}
