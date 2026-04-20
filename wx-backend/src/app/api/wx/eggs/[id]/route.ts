import { NextResponse } from "next/server"
import { sortImageRecords } from "@/lib/media"
import { prisma } from "@/lib/prisma"

export async function GET(
  _: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params

  const egg = await prisma.egg.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      rules: {
        include: {
          elf: {
            include: {
              images: {
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
              },
            },
          },
        },
        orderBy: { probability: "desc" },
      },
    },
  })

  if (!egg) {
    return NextResponse.json({ code: 404, message: "not found" }, { status: 404 })
  }

  const eggImages = sortImageRecords(egg.images).map((image) => ({
    id: image.id,
    url: image.url,
    altText: image.altText ?? "",
    sortOrder: image.sortOrder,
  }))
  const coverImage = egg.avatar ?? eggImages[0]?.url ?? null

  return NextResponse.json({
    code: 200,
    message: "success",
    data: {
      id: egg.id,
      name: egg.name,
      avatar: coverImage,
      coverImage,
      image: coverImage,
      images: eggImages,
      rules: egg.rules.map((rule) => {
        const elfImages = sortImageRecords(rule.elf.images).map((image) => ({
          id: image.id,
          url: image.url,
          altText: image.altText ?? "",
          sortOrder: image.sortOrder,
        }))
        const elfCoverImage = rule.elf.avatar ?? elfImages[0]?.url ?? null

        return {
          id: rule.id,
          minHeight: rule.minHeight,
          maxHeight: rule.maxHeight,
          minWeight: rule.minWeight,
          maxWeight: rule.maxWeight,
          probability: rule.probability,
          elf: {
            id: rule.elf.id,
            name: rule.elf.name,
            element: rule.elf.element,
            rarity: rule.elf.rarity,
            avatar: elfCoverImage,
            coverImage: elfCoverImage,
            images: elfImages,
          },
        }
      }),
    },
  })
}
