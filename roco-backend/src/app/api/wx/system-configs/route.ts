import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type SystemConfigRecord = {
  id: number
  content: string | null
  isVisible: boolean
  updatedAt: Date
}

type SystemConfigResponseItem = {
  id: number
  content: string
  isVisible: boolean
  updatedAt: Date
}

type SystemConfigClient = {
  systemConfig: {
    findMany: (args: {
      where: {
        isVisible?: boolean
        id?: number
      }
      orderBy: Array<{ id: "asc" | "desc" }>
    }) => Promise<SystemConfigRecord[]>
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawId = (searchParams.get("id") || "").trim()
  const id = rawId ? Number.parseInt(rawId, 10) : NaN
  const includeHidden = (searchParams.get("includeHidden") || "").trim().toLowerCase() === "true"

  const db = prisma as unknown as SystemConfigClient
  const configs = await db.systemConfig.findMany({
    where: {
      ...(includeHidden ? {} : { isVisible: true }),
      ...(Number.isFinite(id) ? { id } : {}),
    },
    orderBy: [{ id: "asc" }],
  })

  const data: SystemConfigResponseItem[] = configs.map((item: SystemConfigRecord) => ({
    id: item.id,
    content: item.content ?? "",
    isVisible: item.isVisible,
    updatedAt: item.updatedAt,
  }))

  return NextResponse.json({
    code: 200,
    message: "success",
    data,
  })
}
