import { NextResponse } from "next/server"

import { uploadImageToQiniu } from "@/lib/qiniu"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const folderEntry = formData.get("folder")
    const folder = typeof folderEntry === "string" ? folderEntry : "articles"

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { code: 400, message: "Missing image file" },
        { status: 400 }
      )
    }

    const safeFile = file as Blob & { name?: string; type: string; size: number }

    const uploaded = await uploadImageToQiniu(safeFile, {
      folder,
      fileName: safeFile.name || `clipboard-${Date.now()}.png`,
    })

    return NextResponse.json({
      code: 200,
      message: "success",
      data: uploaded,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload image"
    const isClientError =
      /Only image uploads are supported|Image size must be|Missing required environment variable/i.test(
        message
      )

    return NextResponse.json(
      {
        code: isClientError ? 400 : 500,
        message,
      },
      { status: isClientError ? 400 : 500 }
    )
  }
}
