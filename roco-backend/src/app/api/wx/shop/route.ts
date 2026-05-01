import { NextResponse } from "next/server"

import { resolveImageUrl } from "@/lib/media"
import { prisma } from "@/lib/prisma"

const CURRENCY_LABELS: Record<string, string> = {
  rocoshell: "洛克贝",
  gold: "金币",
  diamond: "钻石",
  event: "活动币",
  other: "其他",
}

function getRoundByHour(hour: number) {
  if (hour >= 8 && hour < 12) return 1
  if (hour >= 12 && hour < 16) return 2
  if (hour >= 16 && hour < 20) return 3
  if (hour >= 20 && hour < 24) return 4
  return 0
}

function getRoundTimeRange(round: number) {
  if (round === 1) return "08:00-12:00"
  if (round === 2) return "12:00-16:00"
  if (round === 3) return "16:00-20:00"
  if (round === 4) return "20:00-24:00"
  return ""
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function getCurrentRound(date: Date) {
  return getRoundByHour(date.getHours())
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const includeUpcoming = searchParams.get("includeUpcoming") === "true"
  const now = new Date()
  const currentRound = getCurrentRound(now)

  const baseWhere = { enabled: true } as const

  const timeWhere = includeUpcoming
    ? {
        OR: [
          { endAt: null },
          { endAt: { gt: now } },
        ],
      }
    : {
        AND: [
          {
            OR: [
              { startAt: null },
              { startAt: { lte: now } },
            ],
          },
          {
            OR: [
              { endAt: null },
              { endAt: { gt: now } },
            ],
          },
        ],
      }

  try {
    const shopItems = await prisma.shopItem.findMany({
      where: { ...baseWhere, ...timeWhere },
      include: {
        item: {
          include: { category: true },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    })

    const allItems = shopItems.map((shop) => {
      const roundSlot = Number(shop.roundSlot)
      const isRoundMode = roundSlot >= 1 && roundSlot <= 4
      const round: number = isRoundMode
        ? roundSlot
        : shop.startAt
          ? getRoundByHour(shop.startAt.getHours())
          : 0
      const isToday = isRoundMode ? true : shop.startAt ? isSameDay(shop.startAt, now) : false
      const isLive = isRoundMode
        ? round === currentRound
        : (!shop.startAt || shop.startAt.getTime() <= now.getTime()) &&
          (!shop.endAt || shop.endAt.getTime() > now.getTime())

      return {
        id: shop.id,
        itemId: shop.itemId,
        name: shop.item.name,
        image: resolveImageUrl(shop.item.image),
        desc: shop.item.desc || "",
        rarity: shop.item.rarity || "",
        effect: shop.item.effect || "",
        obtain: shop.item.obtain || "",
        attr: shop.item.attr || "",
        categoryId: shop.item.categoryId,
        categoryName: shop.item.category.name,
        categoryIcon: shop.item.category.icon || "📦",
        price: shop.price,
        currency: shop.currency,
        currencyLabel: CURRENCY_LABELS[shop.currency] || shop.currency,
        stock: shop.stock,
        sortOrder: shop.sortOrder,
        startAt: shop.startAt ? shop.startAt.toISOString() : null,
        endAt: shop.endAt ? shop.endAt.toISOString() : null,
        roundMode: isRoundMode,
        isToday,
        round,
        roundLabel: round > 0 ? `第${round}轮` : "",
        roundTimeRange: getRoundTimeRange(round),
        note: shop.note || "",
        isLive,
      }
    })
    const data = includeUpcoming ? allItems : allItems.filter((item) => item.isLive)

    return NextResponse.json({
      code: 200,
      message: "success",
      data: {
        items: data,
        total: data.length,
        serverTime: now.toISOString(),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        code: 500,
        message,
        data: null,
      },
      { status: 500 },
    )
  }
}
