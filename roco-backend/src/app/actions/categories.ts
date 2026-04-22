"use server"

import { revalidatePath } from "next/cache"

import { readCategoriesData, type CategoryTarget, writeCategoriesData } from "@/lib/game-data"

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

  const categories = await readCategoriesData()
  const nextCategories = categories.filter((category) => !(category.id === id && category.target === target))

  await writeCategoriesData(nextCategories)

  revalidatePath("/dashboard/categories")
  revalidatePath("/dashboard/elves/new")
  revalidatePath("/dashboard/items")
}
