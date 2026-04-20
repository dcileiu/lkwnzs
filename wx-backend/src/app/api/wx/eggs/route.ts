import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/wx/eggs — list all eggs with rule count
export async function GET() {
  const eggs = await prisma.egg.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { rules: true } }
    }
  })

  return NextResponse.json({
    code: 200,
    message: "success",
    data: eggs.map(egg => ({
      id: egg.id,
      name: egg.name,
      image: egg.image ?? null,
      rulesCount: egg._count.rules
    }))
  })
}
