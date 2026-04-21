import { NextResponse } from "next/server"
import { sortImageRecords } from "@/lib/media"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const element = searchParams.get("element")
  const keyword = searchParams.get("keyword")
  const isHot = searchParams.get("isHot")
  const limit = searchParams.get("limit")
  const parsedLimit = limit ? parseInt(limit, 10) : NaN
  const shouldTake = Number.isFinite(parsedLimit) && parsedLimit > 0

  const whereCondition: {
    element?: string
    isHot?: boolean
    name?: { contains: string }
  } = {}

  if (element && !["all", "全部", "鍏ㄩ儴"].includes(element)) {
    whereCondition.element = element
  }
  if (keyword) whereCondition.name = { contains: keyword }
  if (isHot === "true") whereCondition.isHot = true

  const elves = await prisma.elf.findMany({
    where: whereCondition,
    orderBy: { createdAt: "desc" },
    take: shouldTake ? parsedLimit : undefined,
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  })

  const totalInDb = await prisma.elf.count()

  return NextResponse.json({
    code: 200,
    message: "success",
    data: {
      items: elves.map((elf) => {
        const images = sortImageRecords(elf.images).map((image) => ({
          id: image.id,
          url: image.url,
          altText: image.altText ?? "",
          sortOrder: image.sortOrder,
        }))
        const coverImage = elf.avatar ?? images[0]?.url ?? null

        return {
          ...elf,
          avatar: coverImage,
          coverImage,
          images,
          imageCount: images.length,
        }
      }),
      total: totalInDb,
      collectedCount: 0,
    },
  })
}
