import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { marked } from "marked";
import { resolveImageUrl } from "@/lib/media";

const DEFAULT_ARTICLE_COVER = "/imgs/avatar/default-avatar.jpg";

function looksLikeHtml(content: string) {
  return /<[^>]+>/.test(content);
}

function ensureHtml(content: string) {
  if (!content) return "";
  if (looksLikeHtml(content)) return content;

  const rendered = marked.parse(content);
  return typeof rendered === "string" ? rendered : "";
}

function resolveHtmlImageSrc(content: string) {
  if (!content) return content;
  return content.replace(
    /(<img\b[^>]*\bsrc=["'])([^"']+)(["'][^>]*>)/gi,
    (_, left, src, right) => {
      return `${left}${resolveImageUrl(src)}${right}`;
    },
  );
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
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
        },
      },
      comments: {
        include: {
          user: {
            select: { nickname: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!article) {
    return NextResponse.json(
      { code: 404, message: "not found" },
      { status: 404 },
    );
  }

  // Optionally increment views count asynchronously
  // without awaiting to speed up response
  prisma.article
    .update({
      where: { id: params.id },
      data: { views: { increment: 1 } },
    })
    .catch(console.error);

  const normalizedArticle = {
    ...article,
    thumbnail: resolveImageUrl(article.thumbnail || DEFAULT_ARTICLE_COVER),
    contentHtml: resolveHtmlImageSrc(ensureHtml(article.content)),
    author: article.author
      ? {
          ...article.author,
          avatar: resolveImageUrl(article.author.avatar || ""),
        }
      : article.author,
    comments: article.comments.map((comment) => ({
      ...comment,
      user: {
        ...comment.user,
        avatar: resolveImageUrl(comment.user.avatar || ""),
      },
    })),
  };

  return NextResponse.json({
    code: 200,
    message: "success",
    data: normalizedArticle,
  });
}
