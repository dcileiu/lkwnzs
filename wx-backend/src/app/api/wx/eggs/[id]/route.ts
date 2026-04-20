import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/wx/eggs/[id] — egg detail with hatch rules and elf info
export async function GET(
  _: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params

  const egg = await prisma.egg.findUnique({
    where: { id },
    include: {
      rules: {
        include: {
          elf: {
            select: {
              id: true,
              name: true,
              element: true,
              rarity: true,
              avatar: true
            }
          }
        },
        orderBy: { probability: "desc" }
      }
    }
  })

  if (!egg) {
    return NextResponse.json({ code: 404, message: "not found" }, { status: 404 })
  }

  return NextResponse.json({ code: 200, message: "success", data: egg })
}
