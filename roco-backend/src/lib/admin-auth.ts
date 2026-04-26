const ADMIN_SESSION_COOKIE = "roco_admin_session"

const textEncoder = new TextEncoder()

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(value))
  return toHex(digest)
}

export function getAdminCredentials() {
  const username = process.env.ADMIN_LOGIN_USERNAME?.trim() ?? ""
  const password = process.env.ADMIN_LOGIN_PASSWORD?.trim() ?? ""
  const secret = process.env.ADMIN_LOGIN_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim() || "roco-admin-login-secret"

  return {
    username,
    password,
    secret,
  }
}

export function isAdminLoginConfigured() {
  const { username, password } = getAdminCredentials()
  return Boolean(username && password)
}

export async function createAdminSessionToken() {
  const { username, password, secret } = getAdminCredentials()
  if (!username || !password) return ""
  return sha256(`${username}:${password}:${secret}`)
}

export async function verifyAdminSessionToken(token: string | null | undefined) {
  if (!token) return false
  const expected = await createAdminSessionToken()
  if (!expected) return false
  return token === expected
}

export { ADMIN_SESSION_COOKIE }
