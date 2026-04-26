import { NextResponse } from "next/server";

import { normalizeElementList, serializeElementList } from "@/lib/elements";
import {
  resolveImageUrl,
  sortImageRecords,
  type StoredImageRecord,
} from "@/lib/media";
import { prisma } from "@/lib/prisma";

export async function GET(
  _: Request,
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;

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
  });

  if (!egg) {
    return NextResponse.json(
      { code: 404, message: "not found" },
      { status: 404 },
    );
  }

  const eggImages = sortImageRecords(egg.images as StoredImageRecord[]).map(
    (image: StoredImageRecord) => ({
      id: image.id,
      url: resolveImageUrl(image.url),
      altText: image.altText ?? "",
      sortOrder: image.sortOrder,
    }),
  );
  const coverImage = egg.avatar ?? eggImages[0]?.url ?? null;

  return NextResponse.json({
    code: 200,
    message: "success",
    data: {
      id: egg.id,
      name: egg.name,
      avatar: resolveImageUrl(coverImage),
      coverImage: resolveImageUrl(coverImage),
      image: resolveImageUrl(coverImage),
      images: eggImages,
      rules: egg.rules.map((rule) => {
        const elfImages = sortImageRecords(
          rule.elf.images as StoredImageRecord[],
        ).map((image: StoredImageRecord) => ({
          id: image.id,
          url: image.url,
          altText: image.altText ?? "",
          sortOrder: image.sortOrder,
        }));
        const elfCoverImage = rule.elf.avatar ?? elfImages[0]?.url ?? null;
        const elfElements = normalizeElementList(rule.elf.element);

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
            element: serializeElementList(elfElements),
            elements: elfElements,
            rarity: rule.elf.rarity,
            avatar: resolveImageUrl(elfCoverImage),
            coverImage: resolveImageUrl(elfCoverImage),
            images: elfImages,
          },
        };
      }),
    },
  });
}
