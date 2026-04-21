"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createArticle(formData: FormData) {
  const title = formData.get("title") as string
  const category = formData.get("category") as string
  const content = formData.get("content") as string
  const authorName = formData.get("authorName") as string || "管理员"
  const isHot = formData.get("isHot") === "on"

  if (!title || !category || !content) {
    throw new Error("Missing required fields")
  }

  // Find or create an author
  let author = await prisma.author.findFirst({
    where: { name: authorName }
  })
  
  if (!author) {
    author = await prisma.author.create({
      data: { name: authorName, bio: "系统作者" }
    })
  }

  await prisma.article.create({
    data: {
      title,
      category,
      content,
      isHot,
      authorId: author.id,
      readingTime: Math.ceil(content.length / 400) // Rough estimation
    }
  })

  revalidatePath("/dashboard/articles")
  redirect("/dashboard/articles")
}

export async function deleteArticle(id: string) {
  await prisma.article.delete({ where: { id } })
  revalidatePath("/dashboard/articles")
}
