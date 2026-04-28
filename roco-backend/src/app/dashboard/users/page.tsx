import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DASHBOARD_PAGE_SIZE,
  DashboardPagination,
  parsePageParam,
} from "@/components/dashboard-pagination"

interface UsersPageProps {
  searchParams: Promise<{
    page?: string
  }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parsePageParam(resolvedSearchParams.page)
  const pageSize = DASHBOARD_PAGE_SIZE

  const [users, totalCount, totalComments, totalInteractions] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: {
            comments: true,
            interactions: true,
            collections: true
          }
        }
      }
    }),
    prisma.user.count(),
    prisma.comment.count(),
    prisma.userInteraction.count()
  ])

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">用户管理 (Users)</h1>
          <p className="text-muted-foreground mt-1">
            View and manage registered WeChat Mini Program users.
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-4 py-1">
          共 {totalCount} 名用户
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>总用户数</CardDescription>
            <CardTitle className="text-3xl">{totalCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>累计评论数</CardDescription>
            <CardTitle className="text-3xl">{totalComments}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>累计点赞收藏</CardDescription>
            <CardTitle className="text-3xl">{totalInteractions}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>每页 {pageSize} 位用户，按注册时间倒序展示</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>昵称</TableHead>
                <TableHead>OpenID</TableHead>
                <TableHead className="text-right">评论数</TableHead>
                <TableHead className="text-right">互动数</TableHead>
                <TableHead className="text-right">收集精灵</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {totalCount === 0 ? "暂无用户数据" : "当前页没有数据，请尝试切换其他页码。"}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.nickname || "未设置昵称"}
                    </TableCell>
                    <TableCell className="max-w-[420px] break-all text-xs font-mono text-muted-foreground">
                      {user.openId}
                    </TableCell>
                    <TableCell className="text-right">{user._count.comments}</TableCell>
                    <TableCell className="text-right">{user._count.interactions}</TableCell>
                    <TableCell className="text-right">{user._count.collections}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/users/${user.id}`}>查看详情</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <DashboardPagination
            page={page}
            pageSize={pageSize}
            total={totalCount}
            basePath="/dashboard/users"
          />
        </CardContent>
      </Card>
    </div>
  )
}
