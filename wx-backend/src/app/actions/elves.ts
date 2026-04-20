"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createElf(formData: FormData) {
  const name = formData.get("name") as string
  const element = formData.get("element") as string
  const rarity = formData.get("rarity") as string
  const isHot = formData.get("isHot") === "on"
  
  const hp = parseInt((formData.get("hp") as string) || "0")
  const attack = parseInt((formData.get("attack") as string) || "0")
  const defense = parseInt((formData.get("defense") as string) || "0")
  const speed = parseInt((formData.get("speed") as string) || "0")

  const totalStats = hp + attack + defense + speed

  if (!name || !element || !rarity) {
    throw new Error("Missing required fields")
  }

  await prisma.elf.create({
    data: {
      name,
      element,
      rarity,
      isHot,
      hp,
      attack,
      defense,
      speed,
      totalStats
    }
  })

  revalidatePath("/dashboard/elves")
  redirect("/dashboard/elves")
}

export async function deleteElf(id: string) {
  await prisma.elf.delete({ where: { id } })
  revalidatePath("/dashboard/elves")
}
