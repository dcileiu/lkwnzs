"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"

function readString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function readInt(formData: FormData, key: string, fallback = 0) {
  const raw = readString(formData, key)
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function createItem(formData: FormData) {
  const categoryId = readString(formData, "categoryId")
  const name = readString(formData, "name")

  if (!categoryId || !name) {
    throw new Error("分类和道具名称不能为空")
  }

  const category = await prisma.itemCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  })

  if (!category) {
    throw new Error("分类不存在，请刷新页面后重试")
  }

  await prisma.item.create({
    data: {
      categoryId,
      name,
      image: readString(formData, "image") || null,
      desc: readString(formData, "desc") || null,
      rarity: readString(formData, "rarity") || null,
      effect: readString(formData, "effect") || null,
      obtain: readString(formData, "obtain") || null,
      attr: readString(formData, "attr") || null,
      sortOrder: readInt(formData, "sortOrder", 0),
    },
  })

  revalidatePath("/dashboard/items")
}

export async function updateItem(formData: FormData) {
  const id = readString(formData, "id")
  const categoryId = readString(formData, "categoryId")
  const name = readString(formData, "name")
  const redirectTo = readString(formData, "redirectTo") || "/dashboard/items"

  if (!id || !categoryId || !name) {
    throw new Error("道具 ID、分类和名称不能为空")
  }

  await prisma.item.update({
    where: { id },
    data: {
      categoryId,
      name,
      image: readString(formData, "image") || null,
      desc: readString(formData, "desc") || null,
      rarity: readString(formData, "rarity") || null,
      effect: readString(formData, "effect") || null,
      obtain: readString(formData, "obtain") || null,
      attr: readString(formData, "attr") || null,
      sortOrder: readInt(formData, "sortOrder", 0),
    },
  })

  revalidatePath("/dashboard/items")
  redirect(redirectTo)
}

export async function deleteItem(formData: FormData) {
  const id = readString(formData, "id")
  if (!id) {
    throw new Error("缺少道具 ID")
  }

  await prisma.item.delete({
    where: { id },
  })

  revalidatePath("/dashboard/items")
}
