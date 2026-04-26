import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import {
  ADMIN_SESSION_COOKIE,
  isAdminLoginConfigured,
  verifyAdminSessionToken,
} from "@/lib/admin-auth"

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isDashboard = pathname.startsWith("/dashboard")
  const isLogin = pathname === "/login"

  if (!isDashboard && !isLogin) {
    return NextResponse.next()
  }

  if (!isAdminLoginConfigured()) {
    if (isLogin) return NextResponse.next()

    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const loggedIn = await verifyAdminSessionToken(token)

  if (isDashboard && !loggedIn) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isLogin && loggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
