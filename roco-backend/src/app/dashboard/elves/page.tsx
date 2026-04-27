import Link from "next/link"
import { deleteElf } from "@/app/actions/elves"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

interface ElvesPageProps {
  searchParams: Promise<{
    page?: string
  }>
}

export default async function ElvesPage({ searchParams }: ElvesPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parsePageParam(resolvedSearchParams.page)
  const pageSize = DASHBOARD_PAGE_SIZE

  const [total, elves] = await Promise.all([
    prisma.elf.count(),
    prisma.elf.findMany({
      orderBy: [{ detailQueryCount: "desc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: {
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
          <h1 className="text-2xl font-bold tracking-tight">图鉴管理</h1>
          <p className="mt-1 text-muted-foreground">
            Manage elf cover images, galleries, base stats, grouping tags, and hot ranking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/elves/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              新增精灵
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>全部精灵</CardTitle>
          <CardDescription>{total} 只精灵在册，每页 {pageSize} 条</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>主图</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>组别</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>属性</TableHead>
                <TableHead>身高</TableHead>
                <TableHead>体重</TableHead>
                <TableHead>种族值</TableHead>
                <TableHead className="text-right">详情查询</TableHead>
                <TableHead className="text-right">图集数</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {elves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                    暂无精灵，请先新增。
                  </TableCell>
                </TableRow>
              ) : (
                elves.map((elf) => {
                  const avatarUrl = resolveImageUrl(elf.avatar)
                  return (
                  <TableRow key={elf.id}>
                    <TableCell>
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt={elf.name}
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
                    <TableCell className="font-medium">{elf.name}</TableCell>
                    <TableCell>
                      {elf.group ? <Badge variant="secondary">{elf.group}</Badge> : <span className="text-xs text-muted-foreground">未分组</span>}
                    </TableCell>
                    <TableCell>{elf.category ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{elf.element}</Badge>
                    </TableCell>
                    <TableCell>{elf.height ?? "-"}</TableCell>
                    <TableCell>{elf.weight ?? "-"}</TableCell>
                    <TableCell>{elf.raceValue ?? "-"}</TableCell>
                    <TableCell className="text-right">{elf.detailQueryCount}</TableCell>
                    <TableCell className="text-right">{elf._count.images}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="mr-2" asChild>
                        <Link href={`/dashboard/elves/${elf.id}`}>编辑</Link>
                      </Button>
                      <form action={deleteElf.bind(null, elf.id)} className="inline">
                        <ConfirmSubmitButton
                          variant="destructive"
                          size="sm"
                          confirmMessage={`确认删除精灵「${elf.name}」吗？`}
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
            basePath="/dashboard/elves"
          />
        </CardContent>
      </Card>
    </div>
  )
}
