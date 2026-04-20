import { NextResponse } from "next/server"
import { sortImageRecords } from "@/lib/media"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const eggs = await prisma.egg.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      _count: { select: { rules: true } },
    },
  })

  return NextResponse.json({
    code: 200,
    message: "success",
    data: eggs.map((egg) => {
      const images = sortImageRecords(egg.images).map((image) => ({
        id: image.id,
        url: image.url,
        altText: image.altText ?? "",
        sortOrder: image.sortOrder,
      }))
      const coverImage = egg.avatar ?? images[0]?.url ?? null

      return {
        id: egg.id,
        name: egg.name,
        avatar: coverImage,
        coverImage,
        image: coverImage,
        images,
        imageCount: images.length,
        rulesCount: egg._count.rules,
      }
    }),
  })
}
