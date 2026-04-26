import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DASHBOARD_PAGE_SIZE,
  DashboardPagination,
  parsePageParam,
} from "@/components/dashboard-pagination"
import { resolveImageUrl } from "@/lib/media"
import { prisma } from "@/lib/prisma"

interface EggGroupsPageProps {
  searchParams: Promise<{
    page?: string
  }>
}

function parseJsonArray(value: string | null) {
  if (!value) return [] as string[]

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : []
  } catch {
    return []
  }
}

export default async function EggGroupsPage({ searchParams }: EggGroupsPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parsePageParam(resolvedSearchParams.page)
  const pageSize = DASHBOARD_PAGE_SIZE

  const [totalGroups, totalElves, totalMissing, missingImageElves, groups] = await Promise.all([
    prisma.eggGroup.count(),
    prisma.eggGroupElf.count(),
    prisma.eggGroupElf.count({ where: { OR: [{ image: null }, { image: "" }] } }),
    prisma.eggGroupElf.findMany({
      where: { OR: [{ image: null }, { image: "" }] },
      select: {
        name: true,
        group: { select: { name: true } },
      },
      orderBy: [{ group: { sortOrder: "asc" } }, { name: "asc" }],
      take: 200,
    }),
    prisma.eggGroup.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        elves: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">蛋组管理</h1>
        <p className="mt-1 text-muted-foreground">
          管理洛克王国世界宠物蛋组对照表，数据用于小程序蛋组查询页面。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>蛋组数</CardTitle>
            <CardDescription>当前收录的组别</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalGroups}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>蛋组精灵</CardTitle>
            <CardDescription>按组保存的精灵快照</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalElves}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>待补图片</CardTitle>
            <CardDescription>未从 jingling.json 匹配到图片</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalMissing}</p>
          </CardContent>
        </Card>
      </div>

      {totalGroups === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>暂无蛋组数据</CardTitle>
            <CardDescription>
              请先执行 npm run db:push，然后执行 npm run db:import-egg-groups 初始化蛋组。
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {groups.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  当前页没有数据，请尝试切换其他页码。
                </CardContent>
              </Card>
            ) : (
              groups.map((group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle>{group.name}</CardTitle>
                        <CardDescription>{group.description || "洛克王国世界宠物蛋组对照"}</CardDescription>
                      </div>
                      <Badge variant="secondary">{group.elves.length} 只精灵</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {group.elves.map((elf) => {
                        const imageUrl = resolveImageUrl(elf.image)
                        const attrNames = parseJsonArray(elf.attrNames)

                        return (
                          <div key={elf.id} className="flex items-center gap-3 rounded-lg border p-3">
                            {imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={imageUrl} alt={elf.name} className="h-12 w-12 rounded-lg object-contain" loading="lazy" decoding="async" />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg border text-xs text-muted-foreground">
                                无图
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-medium">{elf.name}</p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {attrNames.length ? (
                                  attrNames.map((attr) => (
                                    <Badge key={attr} variant="outline" className="text-xs">
                                      {attr}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">暂无属性</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DashboardPagination
            page={page}
            pageSize={pageSize}
            total={totalGroups}
            basePath="/dashboard/egg-groups"
          />
        </>
      )}

      {missingImageElves.length ? (
        <Card>
          <CardHeader>
            <CardTitle>未匹配图片的名称</CardTitle>
            <CardDescription>
              这些名称可能需要在 jingling.json 中确认写法（最多展示 200 条，
              当前共 {totalMissing} 条）。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>蛋组</TableHead>
                  <TableHead>名称</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missingImageElves.map((item, index) => (
                  <TableRow key={`${item.group.name}-${item.name}-${index}`}>
                    <TableCell>{item.group.name}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
