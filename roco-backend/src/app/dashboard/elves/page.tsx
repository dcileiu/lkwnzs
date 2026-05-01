import Link from "next/link"
import { deleteElf } from "@/app/actions/elves"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmSubmitButton } from "@/components/confirm-submit-button"
import { ElfEditDialog } from "@/components/elf-edit-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/searchable-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DASHBOARD_PAGE_SIZE,
  DashboardPagination,
  parsePageParam,
} from "@/components/dashboard-pagination"
import { resolveImageUrl } from "@/lib/media"
import { ELEMENT_NAMES, readCategoriesData } from "@/lib/game-data"
import { PlusIcon } from "lucide-react"
import type { Prisma } from "@prisma/client"

interface ElvesPageProps {
  searchParams: Promise<{
    keyword?: string
    group?: string
    category?: string
    element?: string
    page?: string
  }>
}

export default async function ElvesPage({ searchParams }: ElvesPageProps) {
  const resolvedSearchParams = await searchParams
  const keyword = (resolvedSearchParams.keyword || "").trim()
  const group = (resolvedSearchParams.group || "").trim()
  const category = (resolvedSearchParams.category || "").trim()
  const element = (resolvedSearchParams.element || "").trim()
  const page = parsePageParam(resolvedSearchParams.page)
  const pageSize = DASHBOARD_PAGE_SIZE
  const hasFilters = Boolean(keyword || group || category || element)

  const where: Prisma.ElfWhereInput = {
    ...(keyword ? { name: { contains: keyword } } : {}),
    ...(group ? { group } : {}),
    ...(category ? { category } : {}),
    ...(element ? { element } : {}),
  }

  const [total, elves, groupOptionsRaw, categoryOptionsRaw, elementOptionsRaw, categoriesData] = await Promise.all([
    prisma.elf.count({ where }),
    prisma.elf.findMany({
      where,
      orderBy: [{ detailQueryCount: "desc" }, { createdAt: "desc" }],
      include: {
        images: {
          select: {
            url: true,
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
        _count: {
          select: {
            images: true,
          },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.elf.findMany({
      select: { group: true },
      where: { group: { not: null } },
      orderBy: { group: "asc" },
      distinct: ["group"],
    }),
    prisma.elf.findMany({
      select: { category: true },
      where: { category: { not: null } },
      orderBy: { category: "asc" },
      distinct: ["category"],
    }),
    prisma.elf.findMany({
      select: { element: true },
      where: { element: { not: "" } },
      orderBy: { element: "asc" },
      distinct: ["element"],
    }),
    readCategoriesData(),
  ])
  const groupOptions = groupOptionsRaw.map((item) => item.group).filter((item): item is string => Boolean(item?.trim()))
  const categoryOptions = categoryOptionsRaw
    .map((item) => item.category)
    .filter((item): item is string => Boolean(item?.trim()))
  const elementOptions = elementOptionsRaw
    .map((item) => item.element)
    .filter((item): item is string => Boolean(item?.trim()))
  const elfCategoryOptions = categoriesData
    .filter((categoryItem) => categoryItem.target === "elf")
    .map((categoryItem) => categoryItem.name)
  const redirectSearch = new URLSearchParams()
  if (keyword) redirectSearch.set("keyword", keyword)
  if (group) redirectSearch.set("group", group)
  if (category) redirectSearch.set("category", category)
  if (element) redirectSearch.set("element", element)
  if (page > 1) redirectSearch.set("page", String(page))
  const redirectTo = redirectSearch.toString()
    ? `/dashboard/elves?${redirectSearch.toString()}`
    : "/dashboard/elves"

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
          <CardTitle>筛选查询</CardTitle>
          <CardDescription>支持名称关键词和组别/分类/属性筛选。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-5">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="keyword">名称关键词</Label>
              <Input
                id="keyword"
                name="keyword"
                defaultValue={keyword}
                placeholder="搜索精灵名称"
              />
            </div>
            <div className="space-y-2">
              <Label>组别</Label>
              <SearchableSelect
                name="group"
                defaultValue={group}
                options={[
                  { value: "", label: "全部组别" },
                  ...groupOptions.map((option) => ({ value: option, label: option })),
                ]}
                placeholder="全部组别"
                noOptionsText="没有匹配的组别"
              />
            </div>
            <div className="space-y-2">
              <Label>分类</Label>
              <SearchableSelect
                name="category"
                defaultValue={category}
                options={[
                  { value: "", label: "全部分类" },
                  ...categoryOptions.map((option) => ({ value: option, label: option })),
                ]}
                placeholder="全部分类"
                noOptionsText="没有匹配的分类"
              />
            </div>
            <div className="space-y-2">
              <Label>属性</Label>
              <SearchableSelect
                name="element"
                defaultValue={element}
                options={[
                  { value: "", label: "全部属性" },
                  ...elementOptions.map((option) => ({ value: option, label: option })),
                ]}
                placeholder="全部属性"
                noOptionsText="没有匹配的属性"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                查询
              </Button>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href="/dashboard/elves">清除</Link>
              </Button>
            </div>
          </form>
          {hasFilters ? (
            <p className="mt-3 text-sm text-muted-foreground">
              当前筛选：
              {keyword ? ` 关键词「${keyword}」` : ""}
              {group ? ` · 组别「${group}」` : ""}
              {category ? ` · 分类「${category}」` : ""}
              {element ? ` · 属性「${element}」` : ""}，共 {total} 条。
            </p>
          ) : null}
        </CardContent>
      </Card>

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
                      <ElfEditDialog
                        elf={elf}
                        elementOptions={[...ELEMENT_NAMES]}
                        categoryOptions={elfCategoryOptions}
                        redirectTo={redirectTo}
                      />
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
            query={{
              keyword,
              group,
              category,
              element,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
