import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const isHot = searchParams.get("isHot")
  const limit = parseInt(searchParams.get("limit") || "10")

  const whereCondition: any = {}
  if (category && category !== "全部") whereCondition.category = category
  if (isHot === "true") whereCondition.isHot = true

  const articles = await prisma.article.findMany({
    where: whereCondition,
    include: {
      author: {
        select: {
          name: true,
          avatar: true,
        }
      }
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  })

  // Format the response for WeChat Mini Program
  return NextResponse.json({
    code: 200,
    message: "success",
    data: articles
  })
}
