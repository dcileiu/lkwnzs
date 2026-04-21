import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function UsersPage() {
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
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
    prisma.user.count()
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
            <CardTitle className="text-3xl">
              {users.reduce((acc, u) => acc + u._count.comments, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>累计点赞收藏</CardDescription>
            <CardTitle className="text-3xl">
              {users.reduce((acc, u) => acc + u._count.interactions, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>展示最近注册的 50 位用户</CardDescription>
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
                    暂无用户数据
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.nickname || "未设置昵称"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {user.openId.slice(0, 12)}...
                    </TableCell>
                    <TableCell className="text-right">{user._count.comments}</TableCell>
                    <TableCell className="text-right">{user._count.interactions}</TableCell>
                    <TableCell className="text-right">{user._count.collections}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">查看详情</Button>
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
