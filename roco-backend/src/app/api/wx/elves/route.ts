import { NextResponse } from "next/server"

import { matchesElement, normalizeElementList, serializeElementList } from "@/lib/elements"
import { sortImageRecords, type StoredImageRecord } from "@/lib/media"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const element = searchParams.get("element")
  const keyword = searchParams.get("keyword")
  const isHot = searchParams.get("isHot")
  const group = searchParams.get("group")
  const limit = searchParams.get("limit")
  const parsedLimit = limit ? parseInt(limit, 10) : NaN
  const shouldTake = Number.isFinite(parsedLimit) && parsedLimit > 0

  const whereCondition: {
    isHot?: boolean
    name?: { contains: string }
    group?: { equals: string }
  } = {}

  const shouldFilterElement =
    typeof element === "string" && !["all", "全部", "鍏ㄩ儴"].includes(element)

  if (keyword) whereCondition.name = { contains: keyword }
  if (isHot === "true") whereCondition.isHot = true
  if (group) whereCondition.group = { equals: group }

  const orderBy = isHot === "true"
    ? [{ hotOrder: "desc" as const }, { updatedAt: "desc" as const }, { createdAt: "desc" as const }]
    : [{ createdAt: "desc" as const }]

  const elves = await prisma.elf.findMany({
    where: whereCondition,
    orderBy,
    take: shouldTake ? parsedLimit : undefined,
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  })

  const filteredElves = shouldFilterElement
    ? elves.filter((elf) => matchesElement(elf.element, element))
    : elves

  const totalInDb = await prisma.elf.count()

  return NextResponse.json({
    code: 200,
    message: "success",
    data: {
      items: filteredElves.map((elf) => {
        const images = sortImageRecords(elf.images as StoredImageRecord[]).map(
          (image: StoredImageRecord) => ({
            id: image.id,
            url: image.url,
            altText: image.altText ?? "",
            sortOrder: image.sortOrder,
          })
        )
        const coverImage = elf.avatar ?? images[0]?.url ?? null
        const elements = normalizeElementList(elf.element)

        return {
          ...elf,
          group: elf.group ?? "",
          height: elf.height ?? "",
          weight: elf.weight ?? "",
          raceValue: elf.raceValue ?? "",
          hotOrder: elf.hotOrder ?? 0,
          element: serializeElementList(elements),
          elements,
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
