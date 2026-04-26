import Link from "next/link"
import { deleteEgg } from "@/app/actions/eggs"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmSubmitButton } from "@/components/confirm-submit-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DASHBOARD_PAGE_SIZE,
  DashboardPagination,
  parsePageParam,
} from "@/components/dashboard-pagination"
import { resolveImageUrl } from "@/lib/media"
import { PlusIcon } from "lucide-react"

interface EggsPageProps {
  searchParams: Promise<{
    page?: string
  }>
}

export default async function EggsPage({ searchParams }: EggsPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parsePageParam(resolvedSearchParams.page)
  const pageSize = DASHBOARD_PAGE_SIZE

  const [total, eggs] = await Promise.all([
    prisma.egg.count(),
    prisma.egg.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            rules: true,
            images: true,
          },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">蛋集管理</h1>
          <p className="mt-1 text-muted-foreground">
            Manage egg cover images, galleries, and hatch rules.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/eggs/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            新增宠物蛋
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>全部宠物蛋</CardTitle>
          <CardDescription>{total} 种宠物蛋在册，每页 {pageSize} 条</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>主图</TableHead>
                <TableHead>名称</TableHead>
                <TableHead className="text-right">图集数</TableHead>
                <TableHead className="text-right">孵化规则数</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eggs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    {total === 0 ? "暂无宠物蛋，请先新增。" : "当前页没有数据，请尝试切换其他页码。"}
                  </TableCell>
                </TableRow>
              ) : (
                eggs.map((egg) => {
                  const avatarUrl = resolveImageUrl(egg.avatar)
                  return (
                    <TableRow key={egg.id}>
                      <TableCell>
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarUrl}
                            alt={egg.name}
                            className="h-12 w-12 rounded-lg border object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg border text-xs text-muted-foreground">
                            无图
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{egg.name}</TableCell>
                      <TableCell className="text-right">{egg._count.images}</TableCell>
                      <TableCell className="text-right">{egg._count.rules}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="mr-2" disabled>
                          管理规则
                        </Button>
                        <form action={deleteEgg.bind(null, egg.id)} className="inline">
                          <ConfirmSubmitButton
                            variant="destructive"
                            size="sm"
                            type="submit"
                            confirmMessage={`确认删除宠物蛋「${egg.name}」吗？`}
                          >
                            删除
                          </ConfirmSubmitButton>
                        </form>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          <DashboardPagination
            page={page}
            pageSize={pageSize}
            total={total}
            basePath="/dashboard/eggs"
          />
        </CardContent>
      </Card>
    </div>
  )
}
