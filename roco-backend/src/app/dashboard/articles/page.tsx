import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmSubmitButton } from "@/components/confirm-submit-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DASHBOARD_PAGE_SIZE,
  DashboardPagination,
  parsePageParam,
} from "@/components/dashboard-pagination"
import { deleteArticle, setAllArticlesVisible } from "@/app/actions/articles"

interface ArticlesPageProps {
  searchParams: Promise<{
    page?: string
  }>
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parsePageParam(resolvedSearchParams.page)
  const pageSize = DASHBOARD_PAGE_SIZE

  const [total, visibleCount, articles] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { isVisible: true } }),
    prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

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
          <CardDescription>
            当前共有 {total} 篇攻略文章，其中小程序可见 {visibleCount} 篇，每页 {pageSize} 条。
          </CardDescription>
          <div className="flex flex-wrap items-center gap-2">
            <form action={setAllArticlesVisible.bind(null, false)}>
              <Button type="submit" variant="outline" size="sm">
                一键隐藏所有文章
              </Button>
            </form>
            <form action={setAllArticlesVisible.bind(null, true)}>
              <Button type="submit" variant="outline" size="sm">
                一键显示所有文章
              </Button>
            </form>
          </div>
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
                    {total === 0 ? "暂无文章，点击右上角“发布新攻略”开始创建。" : "当前页没有数据，请尝试切换其他页码。"}
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
                      <div className="flex flex-wrap items-center gap-2">
                        {article.isHot ? (
                          <Badge className="bg-orange-500">热门</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">普通</span>
                        )}
                        {article.isVisible ? (
                          <Badge className="bg-emerald-600">显示中</Badge>
                        ) : (
                          <Badge variant="secondary">已隐藏</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{article.views}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/articles/${article.id}`}>编辑</Link>
                        </Button>
                        <form action={deleteArticle.bind(null, article.id)}>
                          <ConfirmSubmitButton
                            variant="destructive"
                            size="sm"
                            type="submit"
                            confirmMessage={`确认删除文章「${article.title}」吗？`}
                          >
                            删除
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <DashboardPagination
            page={page}
            pageSize={pageSize}
            total={total}
            basePath="/dashboard/articles"
          />
        </CardContent>
      </Card>
    </div>
  )
}
