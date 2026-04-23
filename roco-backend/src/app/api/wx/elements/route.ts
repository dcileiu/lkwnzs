import { NextResponse } from "next/server"

import { ELEMENT_NAMES } from "@/lib/game-data"

const ELEMENT_ICON_BASE = "https://roco.cdn.itianci.cn/imgs/shuxing"

export async function GET() {
  const elements = ELEMENT_NAMES.map((name) => ({
    name,
    iconUrl: `${ELEMENT_ICON_BASE}/${name}.webp`,
  }))

  return NextResponse.json({
    code: 200,
    message: "success",
    data: elements,
  })
}
