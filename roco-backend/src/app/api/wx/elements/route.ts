import { NextResponse } from "next/server";

import { ELEMENT_NAMES } from "@/lib/game-data";
import { resolveImageUrl } from "@/lib/media";

export async function GET() {
  const elements = ELEMENT_NAMES.map((name) => ({
    name,
    iconUrl: resolveImageUrl(`/imgs/shuxing/${name}.webp`),
  }));

  return NextResponse.json({
    code: 200,
    message: "success",
    data: elements,
  });
}
