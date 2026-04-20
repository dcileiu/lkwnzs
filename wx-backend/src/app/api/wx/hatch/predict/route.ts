import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { eggId, height, weight } = body

    if (!eggId || height === undefined || weight === undefined) {
      return NextResponse.json({ code: 400, message: "Missing required parameters" }, { status: 400 })
    }

    const numericHeight = parseFloat(height)
    const numericWeight = parseFloat(weight)

    // Find rules that match the egg and where the height/weight fall within min/max bounds
    const matchedRules = await prisma.hatchRule.findMany({
      where: {
        eggId: eggId,
        minHeight: { lte: numericHeight },
        maxHeight: { gte: numericHeight },
        minWeight: { lte: numericWeight },
        maxWeight: { gte: numericWeight }
      },
      include: {
        elf: true
      }
    })

    // If no exact rules match, we could return a fallback or an empty list
    return NextResponse.json({
      code: 200,
      message: "success",
      data: matchedRules.map(rule => ({
        elfName: rule.elf.name,
        elfRarity: rule.elf.rarity,
        elfElement: rule.elf.element,
        probability: rule.probability
      }))
    })

  } catch (error) {
    console.error("Predict Hatching Error:", error)
    return NextResponse.json({ code: 500, message: "Internal Server Error" }, { status: 500 })
  }
}
