import { NextResponse } from "next/server"

import { normalizeElementList, serializeElementList } from "@/lib/elements"
import { sortImageRecords, type StoredImageRecord } from "@/lib/media"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { eggId, height, weight } = body

    if (!eggId || height === undefined || weight === undefined) {
      return NextResponse.json(
        { code: 400, message: "Missing required parameters" },
        { status: 400 }
      )
    }

    const numericHeight = parseFloat(height)
    const numericWeight = parseFloat(weight)

    const matchedRules = await prisma.hatchRule.findMany({
      where: {
        eggId,
        minHeight: { lte: numericHeight },
        maxHeight: { gte: numericHeight },
        minWeight: { lte: numericWeight },
        maxWeight: { gte: numericWeight },
      },
      include: {
        elf: {
          include: {
            images: {
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            },
          },
        },
      },
    })

    return NextResponse.json({
      code: 200,
      message: "success",
      data: matchedRules.map((rule) => {
        const elfImages = sortImageRecords(
          rule.elf.images as StoredImageRecord[]
        ).map((image: StoredImageRecord) => ({
          id: image.id,
          url: image.url,
          altText: image.altText ?? "",
          sortOrder: image.sortOrder,
        }))
        const elfElements = normalizeElementList(rule.elf.element)

        return {
          elfId: rule.elf.id,
          elfName: rule.elf.name,
          elfRarity: rule.elf.rarity,
          elfElement: serializeElementList(elfElements),
          elfElements,
          elfCoverImage: rule.elf.avatar ?? elfImages[0]?.url ?? null,
          elfImages,
          probability: rule.probability,
        }
      }),
    })
  } catch (error) {
    console.error("Predict Hatching Error:", error)
    return NextResponse.json(
      { code: 500, message: "Internal Server Error" },
      { status: 500 }
    )
  }
}
