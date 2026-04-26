"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminCredentials,
  isAdminLoginConfigured,
} from "@/lib/admin-auth"

export type LoginActionState = {
  error?: string
}

function resolveSafeNextPath(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string") return "/dashboard"
  if (!raw.startsWith("/")) return "/dashboard"
  if (raw.startsWith("//")) return "/dashboard"
  if (raw.startsWith("/login")) return "/dashboard"
  return raw
}

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  if (!isAdminLoginConfigured()) {
    return { error: "未配置管理员账号，请先设置 ADMIN_LOGIN_USERNAME / ADMIN_LOGIN_PASSWORD。" }
  }

  const username = String(formData.get("username") ?? "").trim()
  const password = String(formData.get("password") ?? "").trim()
  const { username: adminUsername, password: adminPassword } = getAdminCredentials()

  if (!username || !password) {
    return { error: "请输入账号和密码。" }
  }

  if (username !== adminUsername || password !== adminPassword) {
    return { error: "账号或密码错误。" }
  }

  const token = await createAdminSessionToken()
  if (!token) {
    return { error: "登录配置异常，请检查环境变量。" }
  }

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  redirect(resolveSafeNextPath(formData.get("next")))
}
