import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function DashboardOverviewPage() {
  const [
    articleCount,
    elfCount,
    eggCount,
    userCount,
    recentArticles,
    recentUsers
  ] = await Promise.all([
    prisma.article.count(),
    prisma.elf.count(),
    prisma.egg.count(),
    prisma.user.count(),
    prisma.article.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } }
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, nickname: true, openId: true, createdAt: true }
    })
  ])

  const stats = [
    { label: "攻略文章", value: articleCount, href: "/dashboard/articles", color: "text-blue-600", bg: "bg-blue-50", emoji: "📖" },
    { label: "图鉴精灵", value: elfCount,    href: "/dashboard/elves",    color: "text-green-600", bg: "bg-green-50", emoji: "✨" },
    { label: "宠物蛋集", value: eggCount,    href: "/dashboard/eggs",     color: "text-yellow-600", bg: "bg-yellow-50", emoji: "🥚" },
    { label: "注册用户", value: userCount,   href: "/dashboard/users",    color: "text-purple-600", bg: "bg-purple-50", emoji: "👥" },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">系统概览</h1>
        <p className="text-muted-foreground mt-1">洛克王国助手 CMS 管理后台</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center text-2xl mb-2`}>
                  {stat.emoji}
                </div>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className={`text-4xl ${stat.color}`}>{stat.value}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Articles */}
        <Card>
          <CardHeader>
            <CardTitle>最新攻略</CardTitle>
            <CardDescription>最近发布的 5 篇攻略文章</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentArticles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                      暂无内容，<Link href="/dashboard/articles/new" className="text-blue-500 hover:underline">立即发布</Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentArticles.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium max-w-[180px] truncate">{a.title}</TableCell>
                      <TableCell className="text-muted-foreground">{a.author.name}</TableCell>
                      <TableCell>
                        {a.isHot
                          ? <Badge className="bg-orange-500 text-white">HOT</Badge>
                          : <Badge variant="secondary">普通</Badge>
                        }
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>最新用户</CardTitle>
            <CardDescription>最近注册的 5 位用户</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>昵称</TableHead>
                  <TableHead>OpenID</TableHead>
                  <TableHead>注册时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                      暂无用户数据
                    </TableCell>
                  </TableRow>
                ) : (
                  recentUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nickname || "未设置"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">{u.openId.slice(0, 10)}...</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
