import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { resolveImageUrl } from "@/lib/media"
import { prisma } from "@/lib/prisma"

interface ItemsPageProps {
  searchParams: Promise<{
    category?: string
    keyword?: string
  }>
}

async function getItemDashboardData(filters: { categoryId: string; keyword: string }) {
  try {
    const where = {
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.keyword
        ? {
            OR: [
              { name: { contains: filters.keyword } },
              { desc: { contains: filters.keyword } },
              { effect: { contains: filters.keyword } },
              { obtain: { contains: filters.keyword } },
              { attr: { contains: filters.keyword } },
            ],
          }
        : {}),
    }

    const [categories, items] = await Promise.all([
      prisma.itemCategory.findMany({
        include: {
          _count: {
            select: {
              fields: true,
              items: true,
            },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.item.findMany({
        where,
        include: {
          category: true,
          _count: {
            select: {
              learnableElves: true,
            },
          },
        },
        orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
      }),
    ])

    return {
      categories,
      items,
      error: null as string | null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    return {
      categories: [],
      items: [],
      error: message,
    }
  }
}

export default async function ItemsPage({ searchParams }: ItemsPageProps) {
  const resolvedSearchParams = await searchParams
  const filters = {
    categoryId: (resolvedSearchParams.category || "").trim(),
    keyword: (resolvedSearchParams.keyword || "").trim(),
  }
  const { categories, items, error } = await getItemDashboardData(filters)
  const totalLearnableRelations = items.reduce(
    (total, item) => total + item._count.learnableElves,
    0,
  )
  const hasFilters = Boolean(filters.categoryId || filters.keyword)
  const selectedCategoryName =
    categories.find((category) => category.id === filters.categoryId)?.name || "全部分类"

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">道具管理</h1>
        <p className="mt-1 text-muted-foreground">
          从数据库维护道具基础信息、分类字段和技能石可学精灵关系。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>筛选查询</CardTitle>
          <CardDescription>按分类筛选，或直接搜索道具名称、效果、获取方式。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[220px_1fr_auto_auto]">
            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <select
                id="category"
                name="category"
                defaultValue={filters.categoryId}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">全部分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyword">关键词</Label>
              <Input
                id="keyword"
                name="keyword"
                defaultValue={filters.keyword}
                placeholder="搜索道具名称 / 效果 / 获取方式"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                查询
              </Button>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href="/dashboard/items">清除</Link>
              </Button>
            </div>
          </form>
          {hasFilters ? (
            <p className="mt-3 text-sm text-muted-foreground">
              当前筛选：{selectedCategoryName}
              {filters.keyword ? ` · 关键词「${filters.keyword}」` : ""}，共 {items.length} 条。
            </p>
          ) : null}
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>数据库表尚未就绪</CardTitle>
            <CardDescription>
              请先执行 Prisma 同步并导入 daoju.json 种子数据，然后再使用道具管理。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-lg border bg-muted p-3 text-xs text-muted-foreground">
              {error}
            </pre>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>分类数</CardTitle>
            <CardDescription>数据库中的道具分类</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>道具数</CardTitle>
            <CardDescription>已导入数据库的道具</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>技能石关系</CardTitle>
            <CardDescription>技能石可学精灵关联数</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalLearnableRelations}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>道具分类</CardTitle>
          <CardDescription>分类字段配置用于驱动后台新增/编辑表单。</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无道具分类，请先导入 daoju.json 到数据库。</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {categories.map((category) => (
                <div key={category.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span>{category.icon || "📦"}</span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <Badge variant="outline">{category._count.items} 个道具</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    字段配置：{category._count.fields} 个
                    {category.description ? ` · ${category.description}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>道具数据</CardTitle>
          <CardDescription>数据来自数据库 Item / ItemCategory / SkillStoneLearnableElf。</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="rounded-lg border p-6 text-sm text-muted-foreground">
              暂无可展示的道具数据。请先执行导入脚本把 data/daoju.json 写入数据库。
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>品质</TableHead>
                  <TableHead>图标</TableHead>
                  <TableHead>效果</TableHead>
                  <TableHead>可学精灵</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const imageUrl = resolveImageUrl(item.image)

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category.name}</Badge>
                      </TableCell>
                      <TableCell>{item.rarity || "-"}</TableCell>
                      <TableCell>
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl} alt={item.name} className="h-10 w-10 rounded border object-cover" />
                        ) : (
                          <span className="text-xs text-muted-foreground">无图标</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate">{item.effect || item.desc || "-"}</TableCell>
                      <TableCell>
                        {item._count.learnableElves > 0 ? (
                          <Badge variant="secondary">{item._count.learnableElves} 个</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
