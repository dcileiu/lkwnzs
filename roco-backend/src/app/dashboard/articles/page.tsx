import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusIcon } from "lucide-react"

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: true }
  })

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">攻略管理 (Articles)</h1>
          <p className="text-muted-foreground mt-1">
            Manage your game guides and user articles here.
          </p>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          发布新攻略
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>所有文章</CardTitle>
          <CardDescription>
            {articles.length} 篇文章在库
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题 (Title)</TableHead>
                <TableHead>分类 (Category)</TableHead>
                <TableHead>作者 (Author)</TableHead>
                <TableHead>状态 (Status)</TableHead>
                <TableHead className="text-right">阅读量 (Views)</TableHead>
                <TableHead>操作 (Actions)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    暂无文章，请点击右上角新增
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
                        <Badge className="bg-orange-500">HOT</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Normal</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{article.views}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="mr-2">编辑</Button>
                      <Button variant="destructive" size="sm">删除</Button>
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
