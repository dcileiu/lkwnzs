import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const DEFAULT_ARTICLE_COVER = "https://roco.cdn.itianci.cn/imgs/avatar/default-avatar.jpg"

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    include: {
      author: {
        select: {
          name: true,
          avatar: true,
          bio: true,
          guidesCount: true,
          totalLikes: true,
        }
      },
      comments: {
        include: {
          user: {
            select: { nickname: true, avatar: true }
          }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  })

  if (!article) {
    return NextResponse.json({ code: 404, message: "not found" }, { status: 404 })
  }

  // Optionally increment views count asynchronously 
  // without awaiting to speed up response
  prisma.article.update({
    where: { id: params.id },
    data: { views: { increment: 1 } }
  }).catch(console.error)

  const normalizedArticle = {
    ...article,
    thumbnail: article.thumbnail || DEFAULT_ARTICLE_COVER,
  }

  return NextResponse.json({
    code: 200,
    message: "success",
    data: normalizedArticle
  })
}
