"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  normalizeHtmlImageSourcesForStorage,
  normalizeImagePathForStorage,
  normalizeMarkdownImageSourcesForStorage,
} from "@/lib/media";

const DEFAULT_ARTICLE_COVER = "/imgs/avatar/default-avatar.jpg";

function normalizeArticleCover(rawCover: FormDataEntryValue | null) {
  const value = typeof rawCover === "string" ? rawCover.trim() : "";
  return normalizeImagePathForStorage(value || DEFAULT_ARTICLE_COVER);
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractArticleSummary(contentHtml: string, limit = 140) {
  const plainText = stripHtml(contentHtml);

  if (!plainText) {
    return null;
  }

  return plainText.slice(0, limit);
}

export async function createArticle(formData: FormData) {
  const title = formData.get("title") as string;
  const category = formData.get("category") as string;
  const content = normalizeHtmlImageSourcesForStorage(
    (formData.get("content") as string) || "",
  );
  const contentMarkdown = normalizeMarkdownImageSourcesForStorage(
    (formData.get("contentMarkdown") as string) || "",
  );
  const cover = normalizeArticleCover(formData.get("cover"));
  const authorName = (formData.get("authorName") as string) || "管理员";
  const isHot = formData.get("isHot") === "on";

  if (!title || !category || !content) {
    throw new Error("Missing required fields");
  }

  // Find or create an author
  let author = await prisma.author.findFirst({
    where: { name: authorName },
  });

  if (!author) {
    author = await prisma.author.create({
      data: { name: authorName, bio: "系统作者" },
    });
  }

  await prisma.article.create({
    data: {
      title,
      category,
      content,
      contentMarkdown: contentMarkdown || null,
      thumbnail: cover,
      summary: extractArticleSummary(content),
      isHot,
      authorId: author.id,
      readingTime: Math.max(1, Math.ceil(stripHtml(content).length / 400)),
    },
  });

  revalidatePath("/dashboard/articles");
  redirect("/dashboard/articles");
}

export async function updateArticle(formData: FormData) {
  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const category = formData.get("category") as string;
  const content = normalizeHtmlImageSourcesForStorage(
    (formData.get("content") as string) || "",
  );
  const contentMarkdown = normalizeMarkdownImageSourcesForStorage(
    (formData.get("contentMarkdown") as string) || "",
  );
  const cover = normalizeArticleCover(formData.get("cover"));
  const authorName = (formData.get("authorName") as string) || "管理员";
  const isHot = formData.get("isHot") === "on";

  if (!id || !title || !category || !content) {
    throw new Error("Missing required fields");
  }

  // Find or create an author
  let author = await prisma.author.findFirst({
    where: { name: authorName },
  });

  if (!author) {
    author = await prisma.author.create({
      data: { name: authorName, bio: "系统作者" },
    });
  }

  await prisma.article.update({
    where: { id },
    data: {
      title,
      category,
      content,
      contentMarkdown: contentMarkdown || null,
      thumbnail: cover,
      summary: extractArticleSummary(content),
      isHot,
      authorId: author.id,
      readingTime: Math.max(1, Math.ceil(stripHtml(content).length / 400)),
    },
  });

  revalidatePath("/dashboard/articles");
  redirect("/dashboard/articles");
}

export async function deleteArticle(id: string) {
  await prisma.article.delete({ where: { id } });
  revalidatePath("/dashboard/articles");
}
