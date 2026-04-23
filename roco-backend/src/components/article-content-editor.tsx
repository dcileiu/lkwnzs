"use client"

import * as React from "react"
import { ImageUpIcon, LoaderCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type UploadResult = {
  code: number
  message: string
  data?: {
    key: string
    url: string
  }
}

function insertTextAtCursor(textarea: HTMLTextAreaElement, text: string) {
  const start = textarea.selectionStart ?? textarea.value.length
  const end = textarea.selectionEnd ?? start
  const nextValue =
    textarea.value.slice(0, start) + text + textarea.value.slice(end)

  textarea.value = nextValue

  const nextCursor = start + text.length

  requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(nextCursor, nextCursor)
  })
}

function toMarkdownImage(fileName: string, url: string) {
  const alt = fileName.replace(/\.[a-zA-Z0-9]+$/, "") || "image"
  return `\n![${alt}](${url})\n`
}

async function uploadImage(file: File) {
  const formData = new FormData()
  formData.set("file", file)
  formData.set("folder", "articles")

  const response = await fetch("/api/qiniu/upload", {
    method: "POST",
    body: formData,
  })

  const payload = (await response.json()) as UploadResult

  if (!response.ok || payload.code !== 200 || !payload.data?.url) {
    throw new Error(payload.message || "图片上传失败")
  }

  return payload.data.url
}

interface ArticleContentEditorProps {
  defaultValue?: string
}

export function ArticleContentEditor({ defaultValue }: ArticleContentEditorProps = {}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [statusText, setStatusText] = React.useState(
    "支持 Markdown，支持直接粘贴截图/图片，系统会自动上传到七牛云并插入图片链接。"
  )

  const handleFiles = React.useCallback(async (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    if (!imageFiles.length || !textareaRef.current) {
      return
    }

    setIsUploading(true)
    setStatusText(`正在上传 ${imageFiles.length} 张图片...`)

    try {
      for (const file of imageFiles) {
        const imageUrl = await uploadImage(file)
        insertTextAtCursor(
          textareaRef.current,
          toMarkdownImage(file.name, imageUrl)
        )
      }

      setStatusText("图片上传完成，已自动插入到正文中。")
    } catch (error) {
      setStatusText(
        error instanceof Error ? error.message : "图片上传失败，请稍后重试。"
      )
    } finally {
      setIsUploading(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [])

  const handlePaste = React.useCallback(
    async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const clipboardFiles = Array.from(event.clipboardData.files).filter(
        (file) => file.type.startsWith("image/")
      )

      if (!clipboardFiles.length) {
        return
      }

      event.preventDefault()
      await handleFiles(clipboardFiles)
    },
    [handleFiles]
  )

  const handleChooseImage = React.useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleInputChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files || [])
      await handleFiles(selectedFiles)
    },
    [handleFiles]
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="content">内容正文 (Content)</Label>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleInputChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={handleChooseImage}
          >
            {isUploading ? (
              <LoaderCircleIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImageUpIcon className="mr-2 h-4 w-4" />
            )}
            上传图片
          </Button>
        </div>
      </div>
      <Textarea
        ref={textareaRef}
        id="content"
        name="content"
        required
        className="min-h-[250px]"
        placeholder="在此输入攻略正文（支持 Markdown，也可以直接粘贴图片自动上传）..."
        defaultValue={defaultValue}
        onPaste={handlePaste}
      />
      <p className="text-xs text-muted-foreground">{statusText}</p>
    </div>
  )
}
