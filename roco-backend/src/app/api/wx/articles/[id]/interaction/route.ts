import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type InteractionType = "like" | "favorite";

function badRequest(message: string) {
  return NextResponse.json(
    { code: 400, message },
    { status: 400 },
  );
}

function normalizeType(raw: unknown): InteractionType | null {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (value === "like" || value === "favorite") {
    return value;
  }
  return null;
}

function parseActive(raw: unknown): boolean | null {
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") {
    const value = raw.trim().toLowerCase();
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return null;
}

async function resolveUserId(openId: string) {
  const user = await prisma.user.upsert({
    where: { openId },
    update: {},
    create: { openId },
    select: { id: true },
  });
  return user.id;
}

async function ensureArticleExists(articleId: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, likes: true, bookmarks: true },
  });
  return article;
}

function buildResponsePayload(article: { likes: number; bookmarks: number }, interaction: { isLiked: boolean; isFavorited: boolean }) {
  return {
    likes: article.likes,
    bookmarks: article.bookmarks,
    favorites: article.bookmarks,
    isLiked: interaction.isLiked,
    isFavorited: interaction.isFavorited,
  };
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const articleId = params.id;
  const { searchParams } = new URL(request.url);
  const openId = (searchParams.get("openId") ?? "").trim();

  if (!openId) return badRequest("openId is required");

  const article = await ensureArticleExists(articleId);
  if (!article) return badRequest("article not found");

  const user = await prisma.user.findUnique({
    where: { openId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({
      code: 200,
      message: "success",
      data: buildResponsePayload(article, { isLiked: false, isFavorited: false }),
    });
  }

  const interactions = await prisma.userInteraction.findMany({
    where: {
      userId: user.id,
      articleId,
      type: { in: ["like", "favorite"] },
    },
    select: { type: true },
  });

  const isLiked = interactions.some((item) => item.type === "like");
  const isFavorited = interactions.some((item) => item.type === "favorite");

  return NextResponse.json({
    code: 200,
    message: "success",
    data: buildResponsePayload(article, { isLiked, isFavorited }),
  });
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const articleId = params.id;
  const body = await request.json().catch(() => null);
  const openId = (body?.openId ?? "").trim();
  const type = normalizeType(body?.type);
  const active = parseActive(body?.active);

  if (!openId) return badRequest("openId is required");
  if (!type) return badRequest("type must be like or favorite");
  if (active === null) return badRequest("active must be boolean");

  const article = await ensureArticleExists(articleId);
  if (!article) return badRequest("article not found");

  const userId = await resolveUserId(openId);

  await prisma.$transaction(async (tx) => {
    if (active) {
      const existing = await tx.userInteraction.findUnique({
        where: {
          userId_articleId_type: {
            userId,
            articleId,
            type,
          },
        },
        select: { id: true },
      });
      if (!existing) {
        await tx.userInteraction.create({
          data: { userId, articleId, type },
        });
        if (type === "like") {
          await tx.article.update({
            where: { id: articleId },
            data: { likes: { increment: 1 } },
          });
        } else {
          await tx.article.update({
            where: { id: articleId },
            data: { bookmarks: { increment: 1 } },
          });
        }
      }
      return;
    }

    const deleted = await tx.userInteraction.deleteMany({
      where: { userId, articleId, type },
    });
    if (deleted.count > 0) {
      if (type === "like") {
        await tx.article.updateMany({
          where: { id: articleId, likes: { gt: 0 } },
          data: { likes: { decrement: 1 } },
        });
      } else {
        await tx.article.updateMany({
          where: { id: articleId, bookmarks: { gt: 0 } },
          data: { bookmarks: { decrement: 1 } },
        });
      }
    }
  });

  const latestArticle = await prisma.article.findUnique({
    where: { id: articleId },
    select: { likes: true, bookmarks: true },
  });
  if (!latestArticle) return badRequest("article not found");

  const interactions = await prisma.userInteraction.findMany({
    where: {
      userId,
      articleId,
      type: { in: ["like", "favorite"] },
    },
    select: { type: true },
  });

  const isLiked = interactions.some((item) => item.type === "like");
  const isFavorited = interactions.some((item) => item.type === "favorite");

  return NextResponse.json({
    code: 200,
    message: "success",
    data: buildResponsePayload(latestArticle, { isLiked, isFavorited }),
  });
}
