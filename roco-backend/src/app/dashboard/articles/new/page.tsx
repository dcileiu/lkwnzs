import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { createArticle } from "@/app/actions/articles"
import Link from "next/link"

export default function NewArticlePage() {
  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">发布新攻略</h1>
          <p className="text-muted-foreground mt-1">
            Create a new game guide.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/articles">返回列表</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>文章明细</CardTitle>
          <CardDescription>
            Enter the details of the new article.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createArticle} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">标题 (Title)</Label>
              <Input id="title" name="title" required placeholder="例如：新手必看！10分钟快速入门洛克王国" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">分类 (Category)</Label>
                <Select name="category" required defaultValue="新手入门">
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
                <Label htmlFor="authorName">作者名称 (Author Name)</Label>
                <Input id="authorName" name="authorName" defaultValue="洛克小助手" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">内容正文 (Content)</Label>
              <Textarea 
                id="content" 
                name="content" 
                required 
                className="min-h-[250px]" 
                placeholder="在此输入攻略正文 (支持 Markdown)..." 
              />
            </div>
            
            <div className="flex items-center space-x-2 border p-4 rounded-md">
              <Checkbox id="isHot" name="isHot" />
              <div className="space-y-1 leading-none">
                <Label htmlFor="isHot" className="font-medium">标记为热门 (HOT)</Label>
                <p className="text-sm text-muted-foreground">会在首页的热门攻略池中展示。</p>
              </div>
            </div>

            <Button type="submit" className="w-full">
              发布攻略
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
