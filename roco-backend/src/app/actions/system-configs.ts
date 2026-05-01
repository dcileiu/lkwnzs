"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

function readString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function readInt(formData: FormData, key: string) {
  const value = readString(formData, key)
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function readBoolean(formData: FormData, key: string) {
  const value = formData.get(key)
  if (typeof value !== "string") return false
  return ["on", "true", "1", "yes"].includes(value.toLowerCase())
}

export async function createSystemConfig(formData: FormData) {
  await prisma.systemConfig.create({
    data: {
      content: readString(formData, "content") || null,
      isVisible: readBoolean(formData, "isVisible"),
    },
  })

  revalidatePath("/dashboard/system-configs")
}

export async function updateSystemConfig(formData: FormData) {
  const id = readInt(formData, "id")
  if (!id) {
    throw new Error("缺少配置 ID")
  }

  await prisma.systemConfig.update({
    where: { id },
    data: {
      content: readString(formData, "content") || null,
      isVisible: readBoolean(formData, "isVisible"),
    },
  })

  revalidatePath("/dashboard/system-configs")
}

export async function deleteSystemConfig(formData: FormData) {
  const id = readInt(formData, "id")
  if (!id) {
    throw new Error("缺少配置 ID")
  }

  await prisma.systemConfig.delete({
    where: { id },
  })

  revalidatePath("/dashboard/system-configs")
}
