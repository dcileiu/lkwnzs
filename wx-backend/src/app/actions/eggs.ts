"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createEgg(formData: FormData) {
  const name = formData.get("name") as string

  if (!name) {
    throw new Error("Missing required fields")
  }

  await prisma.egg.create({
    data: {
      name,
    }
  })

  revalidatePath("/dashboard/eggs")
  redirect("/dashboard/eggs")
}

export async function deleteEgg(id: string) {
  await prisma.egg.delete({ where: { id } })
  revalidatePath("/dashboard/eggs")
}
