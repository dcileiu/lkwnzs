import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveImageUrl } from "@/lib/media";

const DEFAULT_AVATAR = "https://wallpaper.cdn.itianci.cn/imgs/avatar/default-avatar.webp";

type WechatSessionResp = {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
};

function badRequest(message: string) {
  return NextResponse.json({ code: 400, message }, { status: 400 });
}

function serverError(message: string) {
  return NextResponse.json({ code: 500, message }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const code = String(body?.code ?? "").trim();
    if (!code) return badRequest("code is required");

    const appId =
      process.env.WX_APPID ||
      process.env.WECHAT_APPID ||
      process.env.APPID ||
      "";
    const appSecret =
      process.env.WX_APPSECRET ||
      process.env.WX_SECRET ||
      process.env.WECHAT_APP_SECRET ||
      process.env.APPSECRET ||
      "";
    if (!appId || !appSecret) {
      return NextResponse.json(
        {
          code: 500,
          message: "微信登录配置缺失，请设置 WX_APPID/WX_APPSECRET",
          data: {
            hasAppId: Boolean(appId),
            hasAppSecret: Boolean(appSecret),
          },
        },
        { status: 500 },
      );
    }

    const search = new URLSearchParams({
      appid: appId,
      secret: appSecret,
      js_code: code,
      grant_type: "authorization_code",
    });

    const wxResp = await fetch(`https://api.weixin.qq.com/sns/jscode2session?${search.toString()}`, {
      method: "GET",
      cache: "no-store",
    }).catch(() => null);

    if (!wxResp?.ok) {
      return serverError("调用微信登录接口失败");
    }

    const sessionData = (await wxResp.json().catch(() => null)) as WechatSessionResp | null;
    if (!sessionData?.openid) {
      const wxMessage = sessionData?.errmsg || "微信登录失败";
      return NextResponse.json(
        {
          code: 500,
          message: `微信登录失败: ${wxMessage}`,
          data: { errcode: sessionData?.errcode ?? -1 },
        },
        { status: 500 },
      );
    }

    const openId = sessionData.openid;
    const user = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
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

      if (existing?.uid) {
        return existing;
      }

      const latest = await tx.user.findFirst({
        where: {
          uid: { not: null },
        },
        orderBy: { uid: "desc" },
        select: { uid: true },
      });
      const allocatedUid = (latest?.uid ?? 0) + 1;

      if (existing) {
        return tx.user.update({
          where: { id: existing.id },
          data: { uid: allocatedUid },
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
      }

      return tx.user.create({
        data: {
          openId,
          uid: allocatedUid,
          nickname: `小洛克${openId.slice(-6)}`,
          avatar: DEFAULT_AVATAR,
        },
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
    });

    return NextResponse.json({
      code: 200,
      message: "success",
      data: {
        ...user,
        avatar: resolveImageUrl(user.avatar || DEFAULT_AVATAR),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown error";
    return NextResponse.json(
      { code: 500, message: `微信登录异常: ${message}` },
      { status: 500 },
    );
  }
}
