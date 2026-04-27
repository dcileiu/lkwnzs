import { NextResponse } from "next/server";
import { resolveImageUrl } from "@/lib/media";
import { prisma } from "@/lib/prisma";

const SUPPORTED_TARGET_TYPES = new Set(["elf", "article"]);

function readPositiveInt(raw: string | null, fallback: number) {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function badRequest(message: string) {
  return NextResponse.json(
    { code: 400, message },
    { status: 400 },
  );
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

async function ensureTargetExists(targetType: string, targetId: string) {
  if (targetType === "article") {
    const article = await prisma.article.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    return Boolean(article);
  }

  if (targetType === "elf") {
    const elf = await prisma.elf.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    return Boolean(elf);
  }

  return false;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const openId = (searchParams.get("openId") ?? "").trim();
  const targetType = (searchParams.get("targetType") ?? "").trim().toLowerCase();
  const limit = readPositiveInt(searchParams.get("limit"), 50);

  if (!openId) {
    return badRequest("openId is required");
  }

  if (targetType && !SUPPORTED_TARGET_TYPES.has(targetType)) {
    return badRequest("invalid targetType");
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
        items: [],
      },
    });
  }

  const items = await prisma.userBrowseHistory.findMany({
    where: {
      userId: user.id,
      ...(targetType ? { targetType } : {}),
    },
    orderBy: [{ viewedAt: "desc" }],
    take: Math.min(limit, 200),
  });

  const articleIds = Array.from(
    new Set(items.filter((item) => item.targetType === "article").map((item) => item.targetId)),
  );
  const elfIds = Array.from(
    new Set(items.filter((item) => item.targetType === "elf").map((item) => item.targetId)),
  );

  const [articles, elves] = await Promise.all([
    articleIds.length
      ? prisma.article.findMany({
          where: { id: { in: articleIds } },
          select: { id: true, title: true, thumbnail: true },
        })
      : Promise.resolve([]),
    elfIds.length
      ? prisma.elf.findMany({
          where: { id: { in: elfIds } },
          select: { id: true, name: true, avatar: true, rarity: true, element: true, group: true },
        })
      : Promise.resolve([]),
  ]);

  const articleMap = new Map(
    articles.map((article) => [
      article.id,
      {
        title: article.title,
        thumbnail: resolveImageUrl(article.thumbnail ?? ""),
      },
    ]),
  );
  const elfMap = new Map(
    elves.map((elf) => [
      elf.id,
      {
        name: elf.name,
        avatar: resolveImageUrl(elf.avatar ?? ""),
        rarity: elf.rarity,
        element: elf.element,
        group: elf.group ?? "",
      },
    ]),
  );

  return NextResponse.json({
    code: 200,
    message: "success",
    data: {
      items: items.map((item) => ({
        id: item.id,
        targetType: item.targetType,
        targetId: item.targetId,
        viewedAt: item.viewedAt,
        viewCount: item.viewCount,
        target: item.targetType === "article" ? (articleMap.get(item.targetId) ?? null) : (elfMap.get(item.targetId) ?? null),
      })),
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const openId = (body?.openId ?? "").trim();
  const targetType = (body?.targetType ?? "").trim().toLowerCase();
  const targetId = (body?.targetId ?? "").trim();

  if (!openId || !targetType || !targetId) {
    return badRequest("openId, targetType and targetId are required");
  }

  if (!SUPPORTED_TARGET_TYPES.has(targetType)) {
    return badRequest("invalid targetType");
  }
  const targetExists = await ensureTargetExists(targetType, targetId);
  if (!targetExists) {
    return badRequest("target not found");
  }

  const userId = await resolveUserId(openId);

  const item = await prisma.userBrowseHistory.upsert({
    where: {
      userId_targetType_targetId: {
        userId,
        targetType,
        targetId,
      },
    },
    update: {
      viewedAt: new Date(),
      viewCount: {
        increment: 1,
      },
    },
    create: {
      userId,
      targetType,
      targetId,
      viewedAt: new Date(),
    },
  });

  return NextResponse.json({
    code: 200,
    message: "success",
    data: {
      id: item.id,
      targetType: item.targetType,
      targetId: item.targetId,
      viewedAt: item.viewedAt,
      viewCount: item.viewCount,
    },
  });
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  const openId = (body?.openId ?? "").trim();
  const targetType = (body?.targetType ?? "").trim().toLowerCase();

  if (!openId) {
    return badRequest("openId is required");
  }

  if (targetType && !SUPPORTED_TARGET_TYPES.has(targetType)) {
    return badRequest("invalid targetType");
  }

  const user = await prisma.user.findUnique({
    where: { openId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({
      code: 200,
      message: "success",
      data: { deletedCount: 0 },
    });
  }

  const result = await prisma.userBrowseHistory.deleteMany({
    where: {
      userId: user.id,
      ...(targetType ? { targetType } : {}),
    },
  });

  return NextResponse.json({
    code: 200,
    message: "success",
    data: { deletedCount: result.count },
  });
}
