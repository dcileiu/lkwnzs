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

type ElfWithImages = RuleWithElf["elf"]

type PredictionEntry = {
  elf: ElfWithImages
  probability: number
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

function buildComparableValues(value: number, unit: "height" | "weight") {
  const candidates = new Set<number>([value])

  if (unit === "height" && value > 0) {
    if (value < 10) {
      candidates.add(value * 100)
    } else {
      candidates.add(value / 100)
    }
  }

  return Array.from(candidates)
}

function isWithinRange(value: number, min: number, max: number) {
  return value >= min && value <= max
}

function matchesRuleRange(rule: RuleWithElf, height: number, weight: number) {
  const heightCandidates = buildComparableValues(height, "height")
  const weightCandidates = buildComparableValues(weight, "weight")

  return (
    heightCandidates.some((value) => isWithinRange(value, rule.minHeight, rule.maxHeight)) &&
    weightCandidates.some((value) => isWithinRange(value, rule.minWeight, rule.maxWeight))
  )
}

function matchesElfRange(elf: ElfWithImages, height: number, weight: number) {
  const parsedHeight = parseRangeValue(elf.height, "height")
  const parsedWeight = parseRangeValue(elf.weight, "weight")

  if (!parsedHeight || !parsedWeight) return false

  const heightCandidates = buildComparableValues(height, "height")
  const weightCandidates = buildComparableValues(weight, "weight")

  return (
    heightCandidates.some((value) => isWithinRange(value, parsedHeight.min, parsedHeight.max)) &&
    weightCandidates.some((value) => isWithinRange(value, parsedWeight.min, parsedWeight.max))
  )
}

function mergePredictionEntries(entries: PredictionEntry[]) {
  const merged = new Map<string, PredictionEntry>()

  for (const entry of entries) {
    const existing = merged.get(entry.elf.id)

    if (!existing || entry.probability > existing.probability) {
      merged.set(entry.elf.id, entry)
    }
  }

  return Array.from(merged.values())
}

function normalizePrediction(elf: ElfWithImages, probability: number) {
  const elfImages = sortImageRecords(
    elf.images as StoredImageRecord[]
  ).map((image: StoredImageRecord) => ({
    id: image.id,
    url: image.url,
    altText: image.altText ?? "",
    sortOrder: image.sortOrder,
  }))
  const elfElements = normalizeElementList(elf.element)

  return {
    elfId: elf.id,
    elfName: elf.name,
    elfRarity: elf.rarity,
    elfElement: serializeElementList(elfElements),
    elfElements,
    elfCoverImage: elf.avatar ?? elfImages[0]?.url ?? null,
    elfImages,
    elfHeight: elf.height ?? "",
    elfWeight: elf.weight ?? "",
    probability,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const eggId = typeof body.eggId === "string" && body.eggId.trim() ? body.eggId.trim() : null
    const numericHeight = parseFloat(String(body.height ?? ""))
    const numericWeight = parseFloat(String(body.weight ?? ""))

    if (!Number.isFinite(numericHeight) || !Number.isFinite(numericWeight)) {
      return NextResponse.json(
        { code: 400, message: "Missing required parameters" },
        { status: 400 }
      )
    }

    if (!eggId) {
      const elves = await prisma.elf.findMany({
        include: {
          images: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
        orderBy: [{ createdAt: "asc" }],
      }) as unknown as ElfWithImages[]

      const matchedElves = elves.filter((elf) => matchesElfRange(elf, numericHeight, numericWeight))
      const globalProbability = matchedElves.length > 0
        ? Number((100 / matchedElves.length).toFixed(2))
        : 0

      return NextResponse.json({
        code: 200,
        message: "success",
        data: matchedElves.map((elf) => normalizePrediction(elf, globalProbability)),
      })
    }

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

    const matchedByRuleEntries = mergePredictionEntries(
      rules
        .filter((rule) => matchesRuleRange(rule, numericHeight, numericWeight))
        .map((rule) => ({
          elf: rule.elf,
          probability: rule.probability,
        }))
    )

    if (eggId && matchedByRuleEntries.length > 0) {
      return NextResponse.json({
        code: 200,
        message: "success",
        data: matchedByRuleEntries.map((entry) => normalizePrediction(entry.elf, entry.probability)),
      })
    }

    const matchedByElfRangeEntries = mergePredictionEntries(
      rules
        .filter((rule) => matchesElfRange(rule.elf, numericHeight, numericWeight))
        .map((rule) => ({
          elf: rule.elf,
          probability: 0,
        }))
    )

    const fallbackProbability = matchedByElfRangeEntries.length > 0
      ? Number((100 / matchedByElfRangeEntries.length).toFixed(2))
      : 0

    return NextResponse.json({
      code: 200,
      message: "success",
      data: matchedByElfRangeEntries.map((entry) => normalizePrediction(entry.elf, fallbackProbability)),
    })
  } catch (error) {
    console.error("Predict Hatching Error:", error)
    return NextResponse.json(
      { code: 500, message: "Internal Server Error" },
      { status: 500 }
    )
  }
}
