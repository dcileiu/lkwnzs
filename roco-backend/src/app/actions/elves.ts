"use server"

import { normalizeElementList, serializeElementList } from "@/lib/elements"
import { prisma } from "@/lib/prisma"
import { parseImageRecords, resolveCoverImage } from "@/lib/media"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createElf(formData: FormData) {
  const name = formData.get("name") as string
  const elements = normalizeElementList([
    ...(formData.getAll("elements") as string[]),
    (formData.get("element") as string | null) || "",
  ])
  const rarity = formData.get("rarity") as string
  const group = ((formData.get("group") as string | null) ?? "").trim()
  const isHot = formData.get("isHot") === "on"
  const height = ((formData.get("height") as string | null) ?? "").trim()
  const weight = ((formData.get("weight") as string | null) ?? "").trim()
  const raceValue = ((formData.get("raceValue") as string | null) ?? "").trim()
  const imageRecords = parseImageRecords(formData.get("galleryImages"))
  const coverImage = resolveCoverImage(formData.get("coverImage"), imageRecords)
  
  const hp = parseInt((formData.get("hp") as string) || "0")
  const attack = parseInt((formData.get("attack") as string) || "0")
  const defense = parseInt((formData.get("defense") as string) || "0")
  const speed = parseInt((formData.get("speed") as string) || "0")

  const totalStats = hp + attack + defense + speed

  if (!name || elements.length === 0 || !rarity) {
    throw new Error("Missing required fields")
  }

  await prisma.elf.create({
    data: {
      name,
      element: serializeElementList(elements),
      rarity,
      group: group || null,
      avatar: coverImage,
      height: height || null,
      weight: weight || null,
      raceValue: raceValue || null,
      isHot,
      hp,
      attack,
      defense,
      speed,
      totalStats,
      images: imageRecords.length > 0
        ? {
            create: imageRecords,
          }
        : undefined,
    }
  })

  revalidatePath("/dashboard/elves")
  redirect("/dashboard/elves")
}

export async function deleteElf(id: string) {
  await prisma.elf.delete({ where: { id } })
  revalidatePath("/dashboard/elves")
}
