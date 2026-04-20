import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const element = searchParams.get("element")
  const keyword = searchParams.get("keyword")

  const whereCondition: any = {}
  if (element && element !== "全部") whereCondition.element = element
  if (keyword) whereCondition.name = { contains: keyword }

  const elves = await prisma.elf.findMany({
    where: whereCondition,
    orderBy: { createdAt: "desc" },
  })

  // Calculate total counts for pokedex stats
  const totalInDb = await prisma.elf.count()

  return NextResponse.json({
    code: 200,
    message: "success",
    data: {
      items: elves,
      total: totalInDb,
      // If we had a test user, we could pass their collected count here:
      collectedCount: 0 
    }
  })
}
