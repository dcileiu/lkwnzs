"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

function getString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

export async function createEvolutionChain(formData: FormData) {
  const name = getString(formData, "name")
  const note = getString(formData, "note")
  const rootElfId = getString(formData, "rootElfId")

  if (!rootElfId) {
    throw new Error("Missing root elf")
  }

  await prisma.evolutionChain.create({
    data: {
      name: name || null,
      note: note || null,
      links: {
        create: {
          childElfId: rootElfId,
          stage: 1,
          sortOrder: 0,
        },
      },
    },
  })

  revalidatePath("/dashboard/evolutions")
}

export async function addEvolutionLink(formData: FormData) {
  const chainId = getString(formData, "chainId")
  const parentElfId = getString(formData, "parentElfId")
  const childElfId = getString(formData, "childElfId")
  const requirement = getString(formData, "requirement")
  const note = getString(formData, "note")
  const sortOrder = parseInt(getString(formData, "sortOrder") || "0", 10)

  if (!chainId || !parentElfId || !childElfId) {
    throw new Error("Missing required evolution fields")
  }

  if (parentElfId === childElfId) {
    throw new Error("Parent and child elf cannot be the same")
  }

  const existingNode = await prisma.elfEvolution.findFirst({
    where: {
      chainId,
      childElfId,
    },
    select: {
      id: true,
    },
  })

  if (existingNode) {
    throw new Error("This elf is already in the evolution chain")
  }

  const parentLink = await prisma.elfEvolution.findFirst({
    where: {
      chainId,
      childElfId: parentElfId,
    },
    select: {
      stage: true,
    },
  })

  if (!parentLink) {
    throw new Error("Parent elf not found in chain")
  }

  await prisma.elfEvolution.create({
    data: {
      chainId,
      parentElfId,
      childElfId,
      stage: parentLink.stage + 1,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      requirement: requirement || null,
      note: note || null,
    },
  })

  revalidatePath("/dashboard/evolutions")
}

export async function deleteEvolutionBranch(formData: FormData) {
  const linkId = getString(formData, "linkId")

  if (!linkId) {
    throw new Error("Missing link id")
  }

  const rootLink = await prisma.elfEvolution.findUnique({
    where: { id: linkId },
    select: {
      chainId: true,
      childElfId: true,
      parentElfId: true,
    },
  })

  if (!rootLink) {
    return
  }

  if (rootLink.parentElfId === null) {
    await prisma.evolutionChain.delete({
      where: { id: rootLink.chainId },
    })
    revalidatePath("/dashboard/evolutions")
    return
  }

  const descendants = new Set<string>([rootLink.childElfId])
  let cursor = [rootLink.childElfId]

  while (cursor.length > 0) {
    const children = await prisma.elfEvolution.findMany({
      where: {
        chainId: rootLink.chainId,
        parentElfId: { in: cursor },
      },
      select: {
        childElfId: true,
      },
    })

    cursor = children
      .map((item) => item.childElfId)
      .filter((childElfId) => !descendants.has(childElfId))

    cursor.forEach((childElfId) => descendants.add(childElfId))
  }

  await prisma.elfEvolution.deleteMany({
    where: {
      chainId: rootLink.chainId,
      childElfId: { in: Array.from(descendants) },
    },
  })

  revalidatePath("/dashboard/evolutions")
}
