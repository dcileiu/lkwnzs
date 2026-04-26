"use server"

import { revalidatePath } from "next/cache"

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

function parseAttrNames(value: string) {
  if (!value) return null
  const list = Array.from(
    new Set(
      value
        .split(/[，,、/\s|]+/g)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )
  return list.length ? JSON.stringify(list) : null
}

export async function createEggGroup(formData: FormData) {
  const id = readString(formData, "id")
  const name = readString(formData, "name")

  if (!id || !name) {
    throw new Error("蛋组 ID 和名称不能为空")
  }

  const exists = await prisma.eggGroup.findUnique({
    where: { id },
    select: { id: true },
  })
  if (exists) {
    throw new Error("该蛋组 ID 已存在，请换一个 ID")
  }

  await prisma.eggGroup.create({
    data: {
      id,
      name,
      description: readString(formData, "description") || null,
      sortOrder: readInt(formData, "sortOrder", 0),
    },
  })

  revalidatePath("/dashboard/egg-groups")
}

export async function createEggGroupElf(formData: FormData) {
  const groupId = readString(formData, "groupId")
  const name = readString(formData, "name")

  if (!groupId || !name) {
    throw new Error("蛋组和精灵名称不能为空")
  }

  const exists = await prisma.eggGroupElf.findFirst({
    where: { groupId, name },
    select: { id: true },
  })
  if (exists) {
    throw new Error("该蛋组下已存在同名精灵，请直接编辑已有记录")
  }

  await prisma.eggGroupElf.create({
    data: {
      groupId,
      name,
      image: readString(formData, "image") || null,
      attributes: readString(formData, "attributes") || null,
      attrNames: parseAttrNames(readString(formData, "attrNames")),
      sortOrder: readInt(formData, "sortOrder", 0),
    },
  })

  revalidatePath("/dashboard/egg-groups")
}

export async function updateEggGroup(formData: FormData) {
  const id = readString(formData, "id")
  const name = readString(formData, "name")
  if (!id || !name) {
    throw new Error("蛋组 ID 和名称不能为空")
  }

  await prisma.eggGroup.update({
    where: { id },
    data: {
      name,
      description: readString(formData, "description") || null,
      sortOrder: readInt(formData, "sortOrder", 0),
    },
  })

  revalidatePath("/dashboard/egg-groups")
}

export async function deleteEggGroup(formData: FormData) {
  const id = readString(formData, "id")
  if (!id) {
    throw new Error("缺少蛋组 ID")
  }

  await prisma.eggGroup.delete({
    where: { id },
  })

  revalidatePath("/dashboard/egg-groups")
}

export async function updateEggGroupElf(formData: FormData) {
  const id = readString(formData, "id")
  const groupId = readString(formData, "groupId")
  const name = readString(formData, "name")
  if (!id || !groupId || !name) {
    throw new Error("精灵 ID、蛋组和名称不能为空")
  }

  const duplicate = await prisma.eggGroupElf.findFirst({
    where: {
      groupId,
      name,
      NOT: { id },
    },
    select: { id: true },
  })
  if (duplicate) {
    throw new Error("该蛋组下已存在同名精灵，请修改名称后再保存")
  }

  await prisma.eggGroupElf.update({
    where: { id },
    data: {
      groupId,
      name,
      image: readString(formData, "image") || null,
      attributes: readString(formData, "attributes") || null,
      attrNames: parseAttrNames(readString(formData, "attrNames")),
      sortOrder: readInt(formData, "sortOrder", 0),
    },
  })

  revalidatePath("/dashboard/egg-groups")
}

export async function deleteEggGroupElf(formData: FormData) {
  const id = readString(formData, "id")
  if (!id) {
    throw new Error("缺少精灵 ID")
  }

  await prisma.eggGroupElf.delete({
    where: { id },
  })

  revalidatePath("/dashboard/egg-groups")
}
