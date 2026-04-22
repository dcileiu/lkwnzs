import { NextResponse } from "next/server"

import { normalizeElementList, serializeElementList } from "@/lib/elements"
import { sortImageRecords, type StoredImageRecord } from "@/lib/media"
import { prisma } from "@/lib/prisma"

export async function GET(
  _: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params

  const elf = await prisma.elf.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  })

  if (!elf) {
    return NextResponse.json({ code: 404, message: "not found" }, { status: 404 })
  }

  const incrementedElf = await prisma.elf.update({
    where: { id: elf.id },
    data: {
      detailQueryCount: {
        increment: 1,
      },
    },
    select: {
      detailQueryCount: true,
    },
  })

  const images = sortImageRecords(elf.images as StoredImageRecord[]).map(
    (image: StoredImageRecord) => ({
      id: image.id,
      url: image.url,
      altText: image.altText ?? "",
      sortOrder: image.sortOrder,
    })
  )
  const coverImage = elf.avatar ?? images[0]?.url ?? null

  const relatedElves = elf.group
    ? await prisma.elf.findMany({
        where: {
          group: elf.group,
          NOT: { id: elf.id },
        },
        orderBy: [{ detailQueryCount: "desc" }, { rarity: "desc" }, { name: "asc" }],
        include: {
          images: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      })
    : []

  const elements = normalizeElementList(elf.element)

  return NextResponse.json({
    code: 200,
    message: "success",
    data: {
      id: elf.id,
      name: elf.name,
      group: elf.group ?? "",
      category: elf.category ?? "",
      element: serializeElementList(elements),
      elements,
      rarity: elf.rarity,
      height: elf.height ?? "",
      weight: elf.weight ?? "",
      raceValue: elf.raceValue ?? "",
      eggImageUrl: elf.eggImageUrl ?? "",
      totalStats: elf.totalStats,
      hp: elf.hp,
      attack: elf.attack,
      defense: elf.defense,
      speed: elf.speed,
      isHot: elf.isHot,
      detailQueryCount: incrementedElf.detailQueryCount,
      avatar: coverImage,
      coverImage,
      images,
      relatedElves: relatedElves.map((member) => {
        const memberImages = sortImageRecords(member.images as StoredImageRecord[])
        const memberCoverImage = member.avatar ?? memberImages[0]?.url ?? null
        const memberElements = normalizeElementList(member.element)

        return {
          id: member.id,
          name: member.name,
          group: member.group ?? "",
          category: member.category ?? "",
          rarity: member.rarity,
          height: member.height ?? "",
          weight: member.weight ?? "",
          raceValue: member.raceValue ?? "",
          eggImageUrl: member.eggImageUrl ?? "",
          detailQueryCount: member.detailQueryCount ?? 0,
          element: serializeElementList(memberElements),
          elements: memberElements,
          avatar: memberCoverImage,
          coverImage: memberCoverImage,
        }
      }),
    },
  })
}
