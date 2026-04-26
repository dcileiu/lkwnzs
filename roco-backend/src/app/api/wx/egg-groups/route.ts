import { NextResponse } from "next/server";

import { resolveImageUrl } from "@/lib/media";
import { prisma } from "@/lib/prisma";

function parseJsonArray(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const groups = await prisma.eggGroup.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      elves: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });

  return NextResponse.json({
    code: 200,
    message: "success",
    data: groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description || "",
      count: group.elves.length,
      elves: group.elves.map((elf) => ({
        id: elf.id,
        name: elf.name,
        image: resolveImageUrl(elf.image),
        attributes: parseJsonArray(elf.attributes),
        attrNames: parseJsonArray(elf.attrNames),
      })),
    })),
  });
}
