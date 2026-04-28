import Link from "next/link"

import { createItem, deleteItem } from "@/app/actions/items"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmSubmitButton } from "@/components/confirm-submit-button"
import { ItemEditDialog } from "@/components/item-edit-dialog"
import {
  DASHBOARD_PAGE_SIZE,
  DashboardPagination,
  parsePageParam,
} from "@/components/dashboard-pagination"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { resolveImageUrl } from "@/lib/media"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

interface ItemsPageProps {
  searchParams: Promise<{
    category?: string
    keyword?: string
    page?: string
  }>
}

async function getItemDashboardData(filters: {
  categoryId: string
  keyword: string
  page: number
  pageSize: number
}) {
  try {
    const where: Prisma.ItemWhereInput = {
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

    const [categories, totalItems, items, totalLearnableRelations] = await Promise.all([
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
      prisma.item.count({ where }),
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
        orderBy: [
          { category: { sortOrder: "asc" } },
          { sortOrder: "asc" },
          { name: "asc" },
        ],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.skillStoneLearnableElf.count(),
    ])

    return {
      categories,
      items,
      totalItems,
      totalLearnableRelations,
      error: null as string | null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    return {
      categories: [],
      items: [],
      totalItems: 0,
      totalLearnableRelations: 0,
      error: message,
    }
  }
}

export default async function ItemsPage({ searchParams }: ItemsPageProps) {
  const resolvedSearchParams = await searchParams
  const filters = {
    categoryId: (resolvedSearchParams.category || "").trim(),
    keyword: (resolvedSearchParams.keyword || "").trim(),
    page: parsePageParam(resolvedSearchParams.page),
    pageSize: DASHBOARD_PAGE_SIZE,
  }
  const { categories, items, totalItems, totalLearnableRelations, error } =
    await getItemDashboardData(filters)
  const totalCategoryItems = categories.reduce(
    (total, category) => total + category._count.items,
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

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>筛选查询</CardTitle>
            <CardDescription>按分类筛选，或直接搜索道具名称、效果、获取方式。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-[110px_1fr_auto_auto]">
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
                {filters.keyword ? ` · 关键词「${filters.keyword}」` : ""}，共 {totalItems} 条。
              </p>
            ) : null}
          </CardContent>
        </Card>
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
            <CardDescription>{hasFilters ? "符合当前筛选的道具" : "已导入数据库的道具"}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{hasFilters ? totalItems : totalCategoryItems}</p>
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

      <Card>
        <CardHeader>
          <CardTitle>新增道具</CardTitle>
          <CardDescription>快速添加新道具到指定分类，后续可继续完善字段。</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无分类，无法新增道具。请先创建或导入分类。</p>
          ) : (
            <form action={createItem} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="new-item-category">分类</Label>
                <select
                  id="new-item-category"
                  name="categoryId"
                  required
                  defaultValue={categories[0]?.id || ""}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-item-name">道具名称</Label>
                <Input id="new-item-name" name="name" required placeholder="例如：高级咕噜球" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-item-rarity">品质</Label>
                <Input id="new-item-rarity" name="rarity" placeholder="普通/稀有/史诗..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-item-image">图片路径</Label>
                <Input id="new-item-image" name="image" placeholder="/imgs/props/xxx.webp" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-item-attr">属性</Label>
                <Input id="new-item-attr" name="attr" placeholder="例如：火 / 恶魔" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-item-sort">排序</Label>
                <Input id="new-item-sort" name="sortOrder" type="number" defaultValue={0} />
              </div>
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="new-item-effect">效果</Label>
                <Textarea id="new-item-effect" name="effect" rows={2} placeholder="可选" />
              </div>
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="new-item-obtain">获取方式</Label>
                <Textarea id="new-item-obtain" name="obtain" rows={2} placeholder="可选" />
              </div>
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="new-item-desc">描述</Label>
                <Textarea id="new-item-desc" name="desc" rows={2} placeholder="可选" />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Button type="submit">新增道具</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>道具分类</CardTitle>
          <CardDescription>分类字段配置用于驱动后台新增/编辑表单。</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无道具分类，请先导入 daoju.json 到数据库。</p>
          ) : (
            <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
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
          <CardDescription>
            数据来自数据库 Item / ItemCategory / SkillStoneLearnableElf。每页 {filters.pageSize} 条。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="rounded-lg border p-6 text-sm text-muted-foreground">
              {totalItems === 0
                ? "暂无可展示的道具数据。请先执行导入脚本把 data/daoju.json 写入数据库。"
                : "当前页没有数据，请尝试切换其他页码。"}
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
                  <TableHead className="text-right">操作</TableHead>
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
                          <img src={imageUrl} alt={item.name} className="h-10 w-10 rounded border object-cover" loading="lazy" decoding="async" />
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
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <ItemEditDialog item={item} categories={categories} />
                          <form action={deleteItem}>
                            <input type="hidden" name="id" value={item.id} />
                            <ConfirmSubmitButton
                              type="submit"
                              variant="destructive"
                              size="sm"
                              confirmMessage={`确认删除道具「${item.name}」吗？`}
                            >
                              删除
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          <DashboardPagination
            page={filters.page}
            pageSize={filters.pageSize}
            total={totalItems}
            basePath="/dashboard/items"
            query={{
              category: filters.categoryId,
              keyword: filters.keyword,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
