import { NextResponse } from "next/server"
import { sortImageRecords } from "@/lib/media"
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

  const images = sortImageRecords(elf.images).map((image) => ({
    id: image.id,
    url: image.url,
    altText: image.altText ?? "",
    sortOrder: image.sortOrder,
  }))
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
        const childImages = sortImageRecords(link.childElf.images).map((image) => ({
          id: image.id,
          url: image.url,
          altText: image.altText ?? "",
          sortOrder: image.sortOrder,
        }))
        const childCoverImage = link.childElf.avatar ?? childImages[0]?.url ?? null

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
            element: link.childElf.element,
            rarity: link.childElf.rarity,
            avatar: childCoverImage,
            coverImage: childCoverImage,
            images: childImages,
          },
        }
      }),
    }
  }

  return NextResponse.json({
    code: 200,
    message: "success",
    data: {
      id: elf.id,
      name: elf.name,
      element: elf.element,
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
