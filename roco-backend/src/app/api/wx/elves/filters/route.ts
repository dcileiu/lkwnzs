import { NextResponse } from "next/server"

import { ELEMENT_NAMES } from "@/lib/game-data"
import { readCategoriesData } from "@/lib/game-data"

const ELEMENT_ICON_BASE = "https://roco.cdn.itianci.cn/imgs/shuxing"

export async function GET() {
  const allCategories = await readCategoriesData()
  const elfCategories = allCategories.filter((c) => c.target === "elf")

  const elements = ELEMENT_NAMES.map((name) => ({
    id: name,
    name,
    iconUrl: `${ELEMENT_ICON_BASE}/${name}.webp`,
  }))

  return NextResponse.json({
    code: 200,
    message: "success",
    data: {
      elements,
      categories: elfCategories,
    },
  })
}
