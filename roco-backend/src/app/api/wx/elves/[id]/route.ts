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

  const images = sortImageRecords(elf.images as StoredImageRecord[]).map(
    (image: StoredImageRecord) => ({
      id: image.id,
      url: image.url,
      altText: image.altText ?? "",
      sortOrder: image.sortOrder,
    })
  )
  const coverImage = elf.avatar ?? images[0]?.url ?? null

  const relation = await prisma.elfEvolution.findFirst({
    where: { childElfId: id },
    select: { chainId: true },
  })

  let evolution = null

  if (relation) {
    const links = await prisma.elfEvolution.findMany({
      where: { chainId: relation.chainId },
      orderBy: [{ stage: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        childElf: {
          include: {
            images: {
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            },
          },
        },
      },
    })

    evolution = {
      chainId: relation.chainId,
      nodes: links.map((link) => {
        const childImages = sortImageRecords(
          link.childElf.images as StoredImageRecord[]
        ).map((image: StoredImageRecord) => ({
          id: image.id,
          url: image.url,
          altText: image.altText ?? "",
          sortOrder: image.sortOrder,
        }))
        const childCoverImage = link.childElf.avatar ?? childImages[0]?.url ?? null
        const childElements = normalizeElementList(link.childElf.element)

        return {
          id: link.id,
          parentElfId: link.parentElfId,
          childElfId: link.childElfId,
          stage: link.stage,
          sortOrder: link.sortOrder,
          requirement: link.requirement ?? "",
          note: link.note ?? "",
          elf: {
            id: link.childElf.id,
            name: link.childElf.name,
            element: serializeElementList(childElements),
            elements: childElements,
            rarity: link.childElf.rarity,
            avatar: childCoverImage,
            coverImage: childCoverImage,
            images: childImages,
          },
        }
      }),
    }
  }

  const elements = normalizeElementList(elf.element)

  return NextResponse.json({
    code: 200,
    message: "success",
    data: {
      id: elf.id,
      name: elf.name,
      element: serializeElementList(elements),
      elements,
      rarity: elf.rarity,
      totalStats: elf.totalStats,
      hp: elf.hp,
      attack: elf.attack,
      defense: elf.defense,
      speed: elf.speed,
      isHot: elf.isHot,
      avatar: coverImage,
      coverImage,
      images,
      evolution,
    },
  })
}
