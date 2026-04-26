"use client"

import * as React from "react"
import { ImageIcon, Loader2, RotateCcw, UploadCloud, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const CDN_BASE_URL = "https://wallpaper.cdn.itianci.cn"

interface ArticleCoverUploaderProps {
  initialValue?: string | null
  initialPreviewUrl?: string | null
}

type UploadResponse = {
  path?: string
  url?: string
  publicUrl?: string
}

function buildPreviewUrl(value: string | null | undefined) {
  if (!value) return ""

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value)
      if (parsed.hostname.endsWith(".cdn.itianci.cn")) {
        return `${CDN_BASE_URL}${parsed.pathname}${parsed.search}${parsed.hash}`
      }
    } catch {
      return value
    }

    return value
  }

  return `${CDN_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`
}

export function ArticleCoverUploader({
  initialValue = "",
  initialPreviewUrl,
}: ArticleCoverUploaderProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [cover, setCover] = React.useState(initialValue || "")
  const [previewUrl, setPreviewUrl] = React.useState(
    initialPreviewUrl || buildPreviewUrl(initialValue),
  )
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState("")

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件")
      return
    }

    setError("")
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.set("file", file)
      formData.set("folder", "articles/covers")

      const response = await fetch("/api/qiniu/upload", {
        method: "POST",
        body: formData,
      })
      const result = await response.json()

      if (!response.ok || result.code !== 200) {
        throw new Error(result.message || "上传失败")
      }

      const uploaded = result.data as UploadResponse
      const nextCover = uploaded.path || uploaded.url || ""

      if (!nextCover) {
        throw new Error("上传成功但未返回图片路径")
      }

      setCover(nextCover)
      setPreviewUrl(uploaded.publicUrl || buildPreviewUrl(nextCover))
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上传失败")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const items = Array.from(event.clipboardData?.items || [])
    const imageItem = items.find((item) => item.kind === "file" && item.type.startsWith("image/"))
    if (!imageItem) return
    const file = imageItem.getAsFile()
    if (!file) return
    event.preventDefault()
    uploadFile(file)
  }

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  function clearCover() {
    setCover("")
    setPreviewUrl("")
    setError("")
  }

  const hasCover = Boolean(previewUrl)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="text-sm font-medium">封面图（可不传）</label>
          <p className="mt-1 text-xs text-muted-foreground">
            上传后数据库只保存图片路径，展示时自动拼接 CDN 域名。
          </p>
        </div>
        {hasCover ? (
          <Button type="button" variant="outline" size="sm" onClick={openFilePicker}>
            <RotateCcw />
            更换封面
          </Button>
        ) : null}
      </div>

      <input type="hidden" name="cover" value={cover} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        tabIndex={0}
        onPaste={handlePaste}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-dashed bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          hasCover ? "border-border" : "border-muted-foreground/30 hover:border-primary/50",
        )}
      >
        {hasCover ? (
          <div className="group relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="文章封面预览" className="h-56 w-full object-cover" />
            <div className="absolute inset-0 flex items-end justify-between gap-3 bg-linear-to-t from-black/65 via-black/10 to-transparent p-4 opacity-100">
              <div className="min-w-0 text-white">
                <p className="text-sm font-medium">已上传封面图</p>
                <p className="truncate text-xs text-white/75">{cover}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={openFilePicker}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
                  重新上传
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={clearCover}
                  disabled={isUploading}
                >
                  <X />
                  清除
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            disabled={isUploading}
            className="flex min-h-56 w-full flex-col items-center justify-center gap-3 px-6 py-10 text-center"
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-background shadow-sm">
              {isUploading ? (
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              ) : (
                <ImageIcon className="size-6 text-muted-foreground" />
              )}
            </span>
            <span className="text-sm font-medium">
              {isUploading ? "正在上传封面..." : "点击上传封面，拖拽图片，或 Ctrl+V 粘贴图片"}
            </span>
            <span className="text-xs text-muted-foreground">
              支持 JPG、PNG、WebP、GIF。点击此区域后可直接粘贴截图。
            </span>
          </button>
        )}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
