import { deleteShopItem, toggleShopItemEnabled } from "@/app/actions/shop-items"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmSubmitButton } from "@/components/confirm-submit-button"
import {
  DASHBOARD_PAGE_SIZE,
  DashboardPagination,
  parsePageParam,
} from "@/components/dashboard-pagination"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { resolveImageUrl } from "@/lib/media"
import { prisma } from "@/lib/prisma"

import { CreateShopItemDialog, EditShopItemDialog } from "./shop-dialogs"
import { getCurrencyLabel, getRoundSlotLabel } from "./shop-shared"

export const dynamic = "force-dynamic"

interface ShopPageProps {
  searchParams: Promise<{
    page?: string
    keyword?: string
    status?: string
  }>
}

function formatDateTimeDisplay(value: Date | null | undefined) {
  if (!value) return "未设置"
  return value.toLocaleString("zh-CN", { hour12: false })
}

function isWithinWindow(startAt: Date | null, endAt: Date | null) {
  const now = Date.now()
  if (startAt && now < startAt.getTime()) return false
  if (endAt && now > endAt.getTime()) return false
  return true
}

async function getDashboardData({
  page,
  pageSize,
  keyword,
  status,
}: {
  page: number
  pageSize: number
  keyword: string
  status: string
}) {
  try {
    const normalizedKeyword = keyword.trim()
    const where = {
      ...(status === "enabled" ? { enabled: true } : {}),
      ...(status === "disabled" ? { enabled: false } : {}),
      ...(normalizedKeyword
        ? {
            OR: [
              { item: { name: { contains: normalizedKeyword } } },
              { item: { category: { name: { contains: normalizedKeyword } } } },
            ],
          }
        : {}),
    }
    const [
      totalShopItems,
      enabledCount,
      shopItems,
      availableItems,
    ] = await Promise.all([
      prisma.shopItem.count({ where }),
      prisma.shopItem.count({ where: { enabled: true } }),
      prisma.shopItem.findMany({
        where,
        include: {
          item: {
            include: { category: true },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.item.findMany({
        include: {
          category: true,
        },
        orderBy: [
          { category: { sortOrder: "asc" } },
          { sortOrder: "asc" },
          { name: "asc" },
        ],
      }),
    ])

    return { shopItems, availableItems, totalShopItems, enabledCount, error: null as string | null }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      shopItems: [],
      availableItems: [],
      totalShopItems: 0,
      enabledCount: 0,
      error: message,
    }
  }
}

export default async function ShopDashboardPage({ searchParams }: ShopPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parsePageParam(resolvedSearchParams.page)
  const keyword = (resolvedSearchParams.keyword || "").trim()
  const status = (resolvedSearchParams.status || "all").trim()
  const pageSize = DASHBOARD_PAGE_SIZE
  const { shopItems, availableItems, totalShopItems, enabledCount, error } =
    await getDashboardData({ page, pageSize, keyword, status })
  const liveCount = shopItems.filter((s) => s.enabled && isWithinWindow(s.startAt, s.endAt)).length

  const itemPickerOptions = availableItems.map((item) => ({
    id: item.id,
    name: item.name,
    rarity: item.rarity,
    categoryName: item.category.name,
  }))

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">远行商人</h1>
        <p className="mt-1 text-muted-foreground">
          从已有道具中挑选商品上架到远行商人，可设置价格、货币、库存和上下架时间。
        </p>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>数据库表尚未就绪</CardTitle>
            <CardDescription>
              请先执行 <code>npm run db:push</code> 同步数据库表结构。
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
            <CardTitle>上架商品</CardTitle>
            <CardDescription>当前所有商品总数</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalShopItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>已启用</CardTitle>
            <CardDescription>启用的商品数量</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{enabledCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>当前页在售</CardTitle>
            <CardDescription>当前页中启用且在限时区间内</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{liveCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>商品管理</CardTitle>
            <CardDescription>支持同一道具在不同时间、多轮次重复上架。</CardDescription>
          </div>
          <CreateShopItemDialog availableItems={itemPickerOptions} />
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>已上架商品</CardTitle>
          <CardDescription>列表展示，新增和编辑均通过弹窗操作。每页 {pageSize} 条。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="mb-4 grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_180px_auto_auto]">
            <Input
              name="keyword"
              defaultValue={keyword}
              placeholder="搜索商品名或分类"
            />
            <select
              name="status"
              defaultValue={status}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">全部状态</option>
              <option value="enabled">仅启用</option>
              <option value="disabled">仅下架</option>
            </select>
            <Button type="submit">筛选</Button>
            <Button type="button" variant="outline" asChild>
              <a href={`/dashboard/shop?page=${page}`}>清除</a>
            </Button>
          </form>

          {shopItems.length === 0 ? (
            <p className="rounded-lg border p-6 text-sm text-muted-foreground">
              {totalShopItems === 0
                ? "远行商人暂无商品，使用上方表单添加首个商品。"
                : "当前页没有数据，请尝试切换其他页码。"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>价格</TableHead>
                  <TableHead>轮次模式</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>上架时间</TableHead>
                  <TableHead>下架时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shopItems.map((shop) => {
                  const imageUrl = resolveImageUrl(shop.item.image)
                  const live = shop.enabled && isWithinWindow(shop.startAt, shop.endAt)
                  return (
                    <TableRow key={shop.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded border bg-muted">
                            {imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={imageUrl}
                                alt={shop.item.name}
                                className="h-10 w-10 object-contain"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">无图</span>
                            )}
                          </div>
                          <span className="font-medium">{shop.item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{shop.item.category.name}</Badge>
                      </TableCell>
                      <TableCell>
                        {shop.price} {getCurrencyLabel(shop.currency)}
                      </TableCell>
                      <TableCell>{getRoundSlotLabel(shop.roundSlot)}</TableCell>
                      <TableCell>
                        {live ? (
                          <Badge className="bg-emerald-600">在售中</Badge>
                        ) : shop.enabled ? (
                          <Badge variant="outline" className="text-amber-600">
                            已启用·不在售卖时段
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            已下架
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDateTimeDisplay(shop.startAt)}</TableCell>
                      <TableCell>{formatDateTimeDisplay(shop.endAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <EditShopItemDialog
                            shop={{
                              id: shop.id,
                              price: shop.price,
                              currency: shop.currency,
                              stock: shop.stock,
                              sortOrder: shop.sortOrder,
                              roundSlot: shop.roundSlot,
                              startAt: shop.startAt,
                              endAt: shop.endAt,
                              note: shop.note,
                              enabled: shop.enabled,
                              item: { id: shop.item.id, name: shop.item.name },
                            }}
                            itemOptions={itemPickerOptions}
                          />
                          <form action={toggleShopItemEnabled}>
                            <input type="hidden" name="id" value={shop.id} />
                            <input type="hidden" name="enabled" value={shop.enabled ? "false" : "true"} />
                            <Button type="submit" variant="outline" size="sm">
                              {shop.enabled ? "下架" : "上架"}
                            </Button>
                          </form>
                          <form action={deleteShopItem}>
                            <input type="hidden" name="id" value={shop.id} />
                            <ConfirmSubmitButton
                              type="submit"
                              variant="destructive"
                              size="sm"
                              confirmMessage={`确认移除商品「${shop.item.name}」吗？`}
                            >
                              移除
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
            page={page}
            pageSize={pageSize}
            total={totalShopItems}
            basePath="/dashboard/shop"
            query={{
              keyword,
              status,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
