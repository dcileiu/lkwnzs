import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"

interface UserDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          comments: true,
          interactions: true,
          collections: true,
        },
      },
    },
  })

  if (!user) notFound()

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">用户详情</h1>
          <p className="mt-1 text-muted-foreground">查看用户基础信息与互动统计。</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/users">返回列表</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{user.nickname || "未设置昵称"}</CardTitle>
          <CardDescription>用户 ID：{user.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">OpenID</p>
            <p className="break-all font-mono text-sm">{user.openId}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">头像</p>
            <p className="break-all text-sm">{user.avatar || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">注册时间</p>
            <p className="text-sm">{new Date(user.createdAt).toLocaleString("zh-CN")}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">评论数</p>
              <p className="text-xl font-semibold">{user._count.comments}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">互动数</p>
              <p className="text-xl font-semibold">{user._count.interactions}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">收集精灵</p>
              <p className="text-xl font-semibold">{user._count.collections}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
