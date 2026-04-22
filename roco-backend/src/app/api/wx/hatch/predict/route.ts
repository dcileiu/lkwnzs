import { NextResponse } from "next/server"

import { normalizeElementList, serializeElementList } from "@/lib/elements"
import { sortImageRecords, type StoredImageRecord } from "@/lib/media"
import { prisma } from "@/lib/prisma"

type RuleWithElf = {
  id: string
  minHeight: number
  maxHeight: number
  minWeight: number
  maxWeight: number
  probability: number
  elf: {
    id: string
    name: string
    rarity: string
    element: string
    height: string | null
    weight: string | null
    images: StoredImageRecord[]
    avatar: string | null
  }
}

function parseRangeValue(raw: string | null | undefined, unit: "height" | "weight") {
  if (!raw) return null

  const normalized = raw.toLowerCase().replace(/\s+/g, "")
  const numberMatches = normalized.match(/\d+(?:\.\d+)?/g)

  if (!numberMatches || numberMatches.length === 0) return null

  let values = numberMatches.map((value) => parseFloat(value)).filter((value) => Number.isFinite(value))

  if (values.length === 0) return null

  const containsMeterUnit = unit === "height" && /(m|米)/.test(normalized) && !/(cm|厘米)/.test(normalized)

  if (containsMeterUnit) {
    values = values.map((value) => value * 100)
  }

  const min = Math.min(...values)
  const max = Math.max(...values)

  return { min, max }
}

function normalizePrediction(rule: RuleWithElf, probability: number) {
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
    elfHeight: rule.elf.height ?? "",
    elfWeight: rule.elf.weight ?? "",
    probability,
  }
}

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

    const rules = await prisma.hatchRule.findMany({
      where: { eggId },
      include: {
        elf: {
          include: {
            images: {
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            },
          },
        },
      },
      orderBy: [{ probability: "desc" }, { createdAt: "asc" }],
    }) as unknown as RuleWithElf[]

    const matchedByRule = rules.filter((rule) => (
      rule.minHeight <= numericHeight &&
      rule.maxHeight >= numericHeight &&
      rule.minWeight <= numericWeight &&
      rule.maxWeight >= numericWeight
    ))

    if (matchedByRule.length > 0) {
      return NextResponse.json({
        code: 200,
        message: "success",
        data: matchedByRule.map((rule) => normalizePrediction(rule, rule.probability)),
      })
    }

    // Fallback: if hatch rules are not configured by numeric range,
    // use elf height/weight range strings to infer candidates.
    const matchedByElfRange = rules.filter((rule) => {
      const parsedHeight = parseRangeValue(rule.elf.height, "height")
      const parsedWeight = parseRangeValue(rule.elf.weight, "weight")

      if (!parsedHeight || !parsedWeight) return false

      return (
        parsedHeight.min <= numericHeight &&
        parsedHeight.max >= numericHeight &&
        parsedWeight.min <= numericWeight &&
        parsedWeight.max >= numericWeight
      )
    })

    const fallbackProbability = matchedByElfRange.length > 0
      ? Number((100 / matchedByElfRange.length).toFixed(2))
      : 0

    return NextResponse.json({
      code: 200,
      message: "success",
      data: matchedByElfRange.map((rule) => normalizePrediction(rule, fallbackProbability)),
    })
  } catch (error) {
    console.error("Predict Hatching Error:", error)
    return NextResponse.json(
      { code: 500, message: "Internal Server Error" },
      { status: 500 }
    )
  }
}
