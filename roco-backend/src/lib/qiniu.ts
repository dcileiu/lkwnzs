import crypto from "node:crypto"

type QiniuConfig = {
  accessKey: string
  secretKey: string
  bucket: string
  domain: string
  uploadUrl: string
}

type UploadTokenResult = {
  key: string
  token: string
  deadline: number
  domain: string
  uploadUrl: string
}

const DEFAULT_UPLOAD_URL = "https://upload.qiniup.com"
const DEFAULT_DOMAIN = "https://roco.cdn.itianci.cn"
const MAX_IMAGE_SIZE = 10 * 1024 * 1024

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function normalizeDomain(domain: string) {
  const trimmed = domain.trim().replace(/\/+$/, "")
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function toUrlSafeBase64(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function sanitizeFolder(folder: string) {
  const normalized = folder
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "")

  return normalized || "articles"
}

function inferExtension(fileName: string, mimeType: string) {
  const fromName = fileName.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase()

  if (fromName) {
    return fromName
  }

  switch (mimeType) {
    case "image/jpeg":
      return "jpg"
    case "image/png":
      return "png"
    case "image/webp":
      return "webp"
    case "image/gif":
      return "gif"
    case "image/svg+xml":
      return "svg"
    default:
      return "png"
  }
}

export function getQiniuConfig(): QiniuConfig {
  return {
    accessKey: getRequiredEnv("QINIU_AK"),
    secretKey: getRequiredEnv("QINIU_SK"),
    bucket: getRequiredEnv("QINIU_BUCKET"),
    domain: normalizeDomain(process.env.QINIU_DOMAIN || DEFAULT_DOMAIN),
    uploadUrl: normalizeDomain(process.env.QINIU_UPLOAD_URL || DEFAULT_UPLOAD_URL),
  }
}

export function buildQiniuKey(options?: {
  folder?: string
  fileName?: string
  mimeType?: string
}) {
  const folder = sanitizeFolder(options?.folder || "articles")
  const ext = inferExtension(options?.fileName || "", options?.mimeType || "")
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "/")

  return `${folder}/${date}/${crypto.randomUUID()}.${ext}`
}

export function createUploadToken(options?: {
  key?: string
  folder?: string
  fileName?: string
  mimeType?: string
  expiresInSeconds?: number
}): UploadTokenResult {
  const config = getQiniuConfig()
  const key = options?.key || buildQiniuKey(options)
  const deadline = Math.floor(Date.now() / 1000) + (options?.expiresInSeconds || 3600)
  const putPolicy = {
    scope: `${config.bucket}:${key}`,
    deadline,
  }

  const encodedPolicy = toUrlSafeBase64(JSON.stringify(putPolicy))
  const sign = crypto
    .createHmac("sha1", config.secretKey)
    .update(encodedPolicy)
    .digest()
  const encodedSign = toUrlSafeBase64(sign)

  return {
    key,
    token: `${config.accessKey}:${encodedSign}:${encodedPolicy}`,
    deadline,
    domain: config.domain,
    uploadUrl: config.uploadUrl,
  }
}

export function buildQiniuPublicUrl(domain: string, key: string) {
  return `${normalizeDomain(domain)}/${key.replace(/^\/+/, "")}`
}

export async function uploadImageToQiniu(file: File, options?: { folder?: string }) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported")
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image size must be 10MB or less")
  }

  const { key, token, domain, uploadUrl } = createUploadToken({
    folder: options?.folder || "articles",
    fileName: file.name,
    mimeType: file.type,
  })

  const payload = new FormData()
  payload.set("token", token)
  payload.set("key", key)
  payload.set("file", file, file.name)

  const response = await fetch(uploadUrl, {
    method: "POST",
    body: payload,
    cache: "no-store",
  })

  const raw = await response.text()
  let parsed: { key?: string; error?: string } | null = null

  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = null
  }

  if (!response.ok) {
    throw new Error(parsed?.error || raw || "Failed to upload image to Qiniu")
  }

  const uploadedKey = parsed?.key || key

  return {
    key: uploadedKey,
    url: buildQiniuPublicUrl(domain, uploadedKey),
  }
}

