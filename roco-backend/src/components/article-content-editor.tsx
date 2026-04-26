"use client"

import * as React from "react"
import { marked } from "marked"
import { MdEditor, type UploadImgEvent } from "md-editor-rt"
import { Label } from "@/components/ui/label"

const CDN_BASE_URL = "https://wallpaper.cdn.itianci.cn"

type UploadResponse = {
  path?: string
  url?: string
  publicUrl?: string
}

interface ArticleContentEditorProps {
  defaultValue?: string
}

function toHtml(markdown: string) {
  const html = marked.parse(markdown || "")
  return typeof html === "string" ? html : ""
}

function buildPreviewUrl(value: string | null | undefined) {
  if (!value) return ""
  if (/^https?:\/\//i.test(value)) return value

  return `${CDN_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`
}

function normalizeEditorMarkdown(markdown: string) {
  if (!markdown) return markdown

  return markdown.replace(
    /(!\[[^\]]*]\()([^) \t\r\n]+)(\))/gi,
    (_, left: string, src: string, right: string) => {
      return `${left}${buildPreviewUrl(src)}${right}`
    },
  )
}

export function ArticleContentEditor({ defaultValue }: ArticleContentEditorProps = {}) {
  const initialMarkdown = normalizeEditorMarkdown(defaultValue || "")
  const [markdown, setMarkdown] = React.useState(initialMarkdown)
  const [html, setHtml] = React.useState(() => toHtml(initialMarkdown))
  const [uploadError, setUploadError] = React.useState("")

  const handleChange = React.useCallback((value: string) => {
    setMarkdown(value)
    setHtml(toHtml(value))
  }, [])

  const handleUploadImg = React.useCallback<UploadImgEvent>((files, callback) => {
    setUploadError("")

    Promise.all(
      files.map(async (file) => {
        const formData = new FormData()
        formData.set("file", file)
        formData.set("folder", "articles/content")

        const response = await fetch("/api/qiniu/upload", {
          method: "POST",
          body: formData,
        })
        const result = await response.json()

        if (!response.ok || result.code !== 200) {
          throw new Error(result.message || "图片上传失败")
        }

        const uploaded = result.data as UploadResponse
        const previewUrl = uploaded.publicUrl || buildPreviewUrl(uploaded.path || uploaded.url)

        if (!previewUrl) {
          throw new Error("图片上传成功但未返回地址")
        }

        return previewUrl
      }),
    )
      .then((urls) => {
        callback(urls)
      })
      .catch((error) => {
        setUploadError(error instanceof Error ? error.message : "图片上传失败")
      })
  }, [])

  return (
    <div className="space-y-2">
      <Label htmlFor="article-content-editor">内容正文 (Markdown)</Label>
      <MdEditor
        editorId="article-content-editor"
        modelValue={markdown}
        onChange={handleChange}
        onUploadImg={handleUploadImg}
        language="zh-CN"
        style={{ minHeight: "420px" }}
      />
      <input type="hidden" name="content" value={html} />
      <input type="hidden" name="contentMarkdown" value={markdown} />
      <p className="text-xs text-muted-foreground">
        可直接复制图片后粘贴到编辑器，图片会自动上传；提交时保存 HTML 和 Markdown。
      </p>
      {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}
    </div>
  )
}
