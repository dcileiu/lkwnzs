import { NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth"

export async function POST(request: Request) {
  const redirectUrl = new URL("/login", request.url)
  const response = NextResponse.redirect(redirectUrl)

  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })

  return response
}
