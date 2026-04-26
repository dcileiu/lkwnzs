import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveImageUrl } from "@/lib/media";

const DEFAULT_ARTICLE_COVER = "/imgs/avatar/default-avatar.jpg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const keyword = (searchParams.get("keyword") || "").trim();
  const isHot = searchParams.get("isHot");
  const limit = parseInt(searchParams.get("limit") || "10");

  const whereCondition: any = {};
  if (category && category !== "全部") whereCondition.category = category;
  if (isHot === "true") whereCondition.isHot = true;
  if (keyword) {
    whereCondition.OR = [
      { title: { contains: keyword } },
      { summary: { contains: keyword } },
      { content: { contains: keyword } },
    ];
  }

  const articles = await prisma.article.findMany({
    where: whereCondition,
    include: {
      author: {
        select: {
          name: true,
          avatar: true,
        },
      },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const normalizedArticles = articles.map((article) => ({
    ...article,
    thumbnail: resolveImageUrl(article.thumbnail || DEFAULT_ARTICLE_COVER),
    author: article.author
      ? {
          ...article.author,
          avatar: resolveImageUrl(article.author.avatar || ""),
        }
      : article.author,
  }));

  // Format the response for WeChat Mini Program
  return NextResponse.json({
    code: 200,
    message: "success",
    data: normalizedArticles,
  });
}
