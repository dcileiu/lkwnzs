import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: true },
  })

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">攻略管理</h1>
          <p className="mt-1 text-muted-foreground">
            在这里管理攻略文章、作者信息和展示状态。
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/articles/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            发布新攻略
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>全部文章</CardTitle>
          <CardDescription>当前共有 {articles.length} 篇攻略文章。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>作者</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">阅读量</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    暂无文章，点击右上角“发布新攻略”开始创建。
                  </TableCell>
                </TableRow>
              ) : (
                articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">{article.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{article.category}</Badge>
                    </TableCell>
                    <TableCell>{article.author.name}</TableCell>
                    <TableCell>
                      {article.isHot ? (
                        <Badge className="bg-orange-500">热门</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">普通</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{article.views}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="mr-2">
                        编辑
                      </Button>
                      <Button variant="destructive" size="sm">
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
