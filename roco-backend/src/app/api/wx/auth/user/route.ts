import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveImageUrl } from "@/lib/media";

const DEFAULT_AVATAR = "https://wallpaper.cdn.itianci.cn/imgs/avatar/default-avatar.webp";

function badRequest(message: string) {
  return NextResponse.json({ code: 400, message }, { status: 400 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const openId = (searchParams.get("openId") ?? "").trim();
  if (!openId) return badRequest("openId is required");

  const user = await prisma.user.findUnique({
    where: { openId },
    select: {
      id: true,
      uid: true,
      openId: true,
      nickname: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { code: 404, message: "user not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    code: 200,
    message: "success",
    data: {
      ...user,
      avatar: resolveImageUrl(user.avatar || DEFAULT_AVATAR),
    },
  });
}
