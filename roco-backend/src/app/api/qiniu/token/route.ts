import { NextResponse } from "next/server"
import { createUploadToken } from "@/lib/qiniu"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get("folder") || "articles"
    const fileName = searchParams.get("fileName") || "image.png"
    const mimeType = searchParams.get("mimeType") || "image/png"
    const tokenInfo = createUploadToken({ folder, fileName, mimeType })

    return NextResponse.json({
      code: 200,
      message: "success",
      data: {
        token: tokenInfo.token,
        key: tokenInfo.key,
        domain: tokenInfo.domain,
        uploadUrl: tokenInfo.uploadUrl,
        expiresAt: tokenInfo.deadline * 1000,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        code: 500,
        message: error instanceof Error ? error.message : "Failed to create upload token",
      },
      { status: 500 }
    )
  }
}
