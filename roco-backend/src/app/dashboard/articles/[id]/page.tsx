import Link from "next/link"
import { notFound } from "next/navigation"

import { updateArticle } from "@/app/actions/articles"
import { ArticleContentEditor } from "@/components/article-content-editor"
import { ArticleCoverUploader } from "@/components/article-cover-uploader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { normalizeImagePathForStorage, resolveImageUrl } from "@/lib/media"
import { prisma } from "@/lib/prisma"

interface EditArticlePageProps {
  params: Promise<{ id: string }>
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params
  
  const article = await prisma.article.findUnique({
    where: { id },
    include: { author: true }
  })

  if (!article) {
    notFound()
  }

  const coverPath = normalizeImagePathForStorage(article.thumbnail)
  const coverPreviewUrl = resolveImageUrl(article.thumbnail)

  return (
    <div className="flex max-w-4xl flex-col gap-4 p-4 lg:p-8">
      <div className="sticky top-0 z-20 -mx-4 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">编辑攻略</h1>
          <p className="mt-1 text-muted-foreground">
            修改 Markdown 内容，保存后会同步更新 HTML 渲染结果。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/articles">返回列表</Link>
          </Button>
          <Button type="submit" form="article-edit-form">
            保存修改
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>文章信息</CardTitle>
          <CardDescription>编辑标题、分类和正文内容。</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="article-edit-form" action={updateArticle} className="space-y-6">
            <input type="hidden" name="id" value={article.id} />
            
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={article.title}
                placeholder="例如：新手必看，10 分钟快速入门洛克王国"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Select name="category" required defaultValue={article.category}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部">全部</SelectItem>
                    <SelectItem value="新手入门">新手入门</SelectItem>
                    <SelectItem value="精灵攻略">精灵攻略</SelectItem>
                    <SelectItem value="战斗技巧">战斗技巧</SelectItem>
                    <SelectItem value="活动攻略">活动攻略</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorName">作者名</Label>
                <Input
                  id="authorName"
                  name="authorName"
                  defaultValue={article.author.name}
                  placeholder="输入作者名称"
                />
              </div>

              <div className="flex items-center space-x-2 rounded-md border p-4 md:col-span-2">
                <Checkbox id="isHot" name="isHot" defaultChecked={article.isHot} />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="isHot" className="font-medium">
                    标记为热门攻略
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    勾选后会优先展示在首页热门攻略区域。
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 rounded-md border p-4 md:col-span-2">
                <Checkbox id="isVisible" name="isVisible" defaultChecked={article.isVisible} />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="isVisible" className="font-medium">
                    小程序显示
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    关闭后文章仅在后台可见，小程序文章列表不会展示。
                  </p>
                </div>
              </div>
            </div>

            <ArticleCoverUploader
              initialValue={coverPath}
              initialPreviewUrl={coverPreviewUrl}
            />

            <ArticleContentEditor defaultValue={article.contentMarkdown || article.content} />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
