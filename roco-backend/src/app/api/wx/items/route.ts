import { NextResponse } from "next/server";

import { resolveImageUrl } from "@/lib/media";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get("category") || "").trim();
  const keyword = (searchParams.get("keyword") || "").trim();
  const shouldFilterCategory = category && !["all", "全部"].includes(category);

  const where = {
    ...(shouldFilterCategory ? { categoryId: category } : {}),
    ...(keyword
      ? {
          OR: [
            { name: { contains: keyword } },
            { desc: { contains: keyword } },
            { effect: { contains: keyword } },
            { obtain: { contains: keyword } },
            { attr: { contains: keyword } },
          ],
        }
      : {}),
  };

  const [categories, items, totalCount] = await Promise.all([
    prisma.itemCategory.findMany({
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.item.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: {
            learnableElves: true,
          },
        },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.item.count(),
  ]);

  return NextResponse.json({
    code: 200,
    message: "success",
    data: {
      categories: categories.map((item) => ({
        id: item.id,
        name: item.name,
        icon: item.icon || "📦",
        description: item.description || "",
        count: item._count.items,
      })),
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        image: resolveImageUrl(item.image),
        desc: item.desc || "",
        rarity: item.rarity || "",
        effect: item.effect || "",
        obtain: item.obtain || "",
        attr: item.attr || "",
        categoryId: item.categoryId,
        categoryName: item.category.name,
        categoryIcon: item.category.icon || "📦",
        learnableElfCount: item._count.learnableElves,
      })),
      total: totalCount,
      filteredTotal: items.length,
    },
  });
}
