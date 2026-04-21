import { NextResponse } from "next/server"

import { uploadImageToQiniu } from "@/lib/qiniu"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const folderEntry = formData.get("folder")
    const folder = typeof folderEntry === "string" ? folderEntry : "articles"

    if (!(file instanceof File)) {
      return NextResponse.json(
        { code: 400, message: "Missing image file" },
        { status: 400 }
      )
    }

    const uploaded = await uploadImageToQiniu(file, { folder })

    return NextResponse.json({
      code: 200,
      message: "success",
      data: uploaded,
    })
  } catch (error) {
    return NextResponse.json(
      {
        code: 500,
        message: error instanceof Error ? error.message : "Failed to upload image",
      },
      { status: 500 }
    )
  }
}
