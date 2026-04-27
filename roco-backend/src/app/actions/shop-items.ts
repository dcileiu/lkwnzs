"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"

const SUPPORTED_CURRENCIES = ["gold", "diamond", "rocoshell", "event", "other"] as const

type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

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

function readOptionalInt(formData: FormData, key: string) {
  const raw = readString(formData, key)
  if (!raw) return null
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function readOptionalRoundSlot(formData: FormData, key: string) {
  const value = readOptionalInt(formData, key)
  if (!value) return null
  if (value >= 1 && value <= 4) return value
  return null
}

function readBoolean(formData: FormData, key: string) {
  const value = formData.get(key)
  if (typeof value !== "string") return false
  return ["on", "true", "1", "yes"].includes(value.toLowerCase())
}

function readDate(formData: FormData, key: string) {
  const raw = readString(formData, key)
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

function normalizeCurrency(value: string): SupportedCurrency {
  const lower = value.toLowerCase() as SupportedCurrency
  return SUPPORTED_CURRENCIES.includes(lower) ? lower : "gold"
}

export async function createShopItem(formData: FormData) {
  const itemId = readString(formData, "itemId")
  if (!itemId) {
    throw new Error("缺少道具 ID")
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { id: true },
  })
  if (!item) {
    throw new Error("道具不存在")
  }

  const roundSlot = readOptionalRoundSlot(formData, "roundSlot")
  const manualStartAt = readDate(formData, "startAt")
  const manualEndAt = readDate(formData, "endAt")

  await prisma.shopItem.create({
    data: {
      itemId,
      price: readInt(formData, "price", 0),
      currency: normalizeCurrency(readString(formData, "currency") || "gold"),
      stock: readOptionalInt(formData, "stock"),
      enabled: readBoolean(formData, "enabled"),
      roundSlot,
      sortOrder: readInt(formData, "sortOrder", 0),
      startAt: roundSlot ? null : manualStartAt,
      endAt: roundSlot ? null : manualEndAt,
      note: readString(formData, "note") || null,
    },
  })

  revalidatePath("/dashboard/shop")
}

export async function updateShopItem(formData: FormData) {
  const id = readString(formData, "id")
  if (!id) {
    throw new Error("缺少远行商人商品 ID")
  }

  const roundSlot = readOptionalRoundSlot(formData, "roundSlot")
  const manualStartAt = readDate(formData, "startAt")
  const manualEndAt = readDate(formData, "endAt")

  await prisma.shopItem.update({
    where: { id },
    data: {
      price: readInt(formData, "price", 0),
      currency: normalizeCurrency(readString(formData, "currency") || "gold"),
      stock: readOptionalInt(formData, "stock"),
      enabled: readBoolean(formData, "enabled"),
      roundSlot,
      sortOrder: readInt(formData, "sortOrder", 0),
      startAt: roundSlot ? null : manualStartAt,
      endAt: roundSlot ? null : manualEndAt,
      note: readString(formData, "note") || null,
    },
  })

  revalidatePath("/dashboard/shop")
}

export async function toggleShopItemEnabled(formData: FormData) {
  const id = readString(formData, "id")
  const next = readBoolean(formData, "enabled")
  if (!id) {
    throw new Error("缺少远行商人商品 ID")
  }

  await prisma.shopItem.update({
    where: { id },
    data: { enabled: next },
  })

  revalidatePath("/dashboard/shop")
}

export async function deleteShopItem(formData: FormData) {
  const id = readString(formData, "id")
  if (!id) {
    throw new Error("缺少远行商人商品 ID")
  }

  await prisma.shopItem.delete({ where: { id } })

  revalidatePath("/dashboard/shop")
}
