import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function badRequest(message: string) {
  return NextResponse.json(
    { code: 400, message },
    { status: 400 },
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const openId = (searchParams.get("openId") ?? "").trim();

  if (!openId) {
    return badRequest("openId is required");
  }

  const user = await prisma.user.findUnique({
    where: { openId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({
      code: 200,
      message: "success",
      data: {
        likeCount: 0,
        favoriteCount: 0,
        historyCount: 0,
        likedArticleIds: [],
        favoritedArticleIds: [],
        historyArticleIds: [],
      },
    });
  }

  const [likedRows, favoritedRows, historyRows] = await Promise.all([
    prisma.userInteraction.findMany({
      where: {
        userId: user.id,
        type: "like",
        article: { isVisible: true },
      },
      select: { articleId: true },
      distinct: ["articleId"],
    }),
    prisma.userInteraction.findMany({
      where: {
        userId: user.id,
        type: "favorite",
        article: { isVisible: true },
      },
      select: { articleId: true },
      distinct: ["articleId"],
    }),
    prisma.userBrowseHistory.findMany({
      where: {
        userId: user.id,
        targetType: "article",
      },
      select: { targetId: true },
      distinct: ["targetId"],
    }),
  ]);

  const likedArticleIds = likedRows.map((item) => item.articleId);
  const favoritedArticleIds = favoritedRows.map((item) => item.articleId);

  const historyCandidateIds = historyRows.map((item) => item.targetId).filter(Boolean);
  const historyArticleIds = historyCandidateIds.length
    ? (
        await prisma.article.findMany({
          where: {
            id: { in: historyCandidateIds },
            isVisible: true,
          },
          select: { id: true },
        })
      ).map((item) => item.id)
    : [];

  return NextResponse.json({
    code: 200,
    message: "success",
    data: {
      likeCount: likedArticleIds.length,
      favoriteCount: favoritedArticleIds.length,
      historyCount: historyArticleIds.length,
      likedArticleIds,
      favoritedArticleIds,
      historyArticleIds,
    },
  });
}
