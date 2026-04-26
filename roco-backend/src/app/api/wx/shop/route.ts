import { NextResponse } from "next/server"

import { resolveImageUrl } from "@/lib/media"
import { prisma } from "@/lib/prisma"

const CURRENCY_LABELS: Record<string, string> = {
  gold: "金币",
  diamond: "钻石",
  rocoshell: "洛克贝",
  event: "活动币",
  other: "其他",
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const includeUpcoming = searchParams.get("includeUpcoming") === "true"
  const now = new Date()

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

    const data = shopItems.map((shop) => {
      const isLive =
        (!shop.startAt || shop.startAt.getTime() <= now.getTime()) &&
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
        note: shop.note || "",
        isLive,
      }
    })

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
