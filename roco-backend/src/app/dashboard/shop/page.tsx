import {
  createShopItem,
  deleteShopItem,
  toggleShopItemEnabled,
  updateShopItem,
} from "@/app/actions/shop-items"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ConfirmSubmitButton } from "@/components/confirm-submit-button"
import {
  DASHBOARD_PAGE_SIZE,
  DashboardPagination,
  parsePageParam,
} from "@/components/dashboard-pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShopItemPicker } from "@/components/shop-item-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { resolveImageUrl } from "@/lib/media"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

interface ShopPageProps {
  searchParams: Promise<{
    page?: string
    keyword?: string
    status?: string
  }>
}

const CURRENCY_OPTIONS = [
  { value: "gold", label: "金币" },
  { value: "diamond", label: "钻石" },
  { value: "rocoshell", label: "洛克贝" },
  { value: "event", label: "活动币" },
  { value: "other", label: "其他" },
] as const

const ROUND_SLOT_OPTIONS = [
  { value: "1", label: "第1轮（08:00-12:00）" },
  { value: "2", label: "第2轮（12:00-16:00）" },
  { value: "3", label: "第3轮（16:00-20:00）" },
  { value: "4", label: "第4轮（20:00-24:00）" },
] as const

function getCurrencyLabel(value: string) {
  return CURRENCY_OPTIONS.find((option) => option.value === value)?.label || value
}

function getRoundSlotLabel(value: number | null | undefined) {
  if (!value) return "自定义时间"
  return ROUND_SLOT_OPTIONS.find((option) => Number(option.value) === value)?.label || `第${value}轮`
}

function formatDateTimeLocal(value: Date | null | undefined) {
  if (!value) return ""
  const offset = value.getTimezoneOffset()
  const local = new Date(value.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
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
          <Dialog>
            <DialogTrigger render={<Button />}>新增商品</DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>新增远行商人商品</DialogTitle>
                <DialogDescription>从已存在道具中新增一条上架记录。</DialogDescription>
              </DialogHeader>
              {availableItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  尚无道具数据，请先在「道具管理」中导入道具。
                </p>
              ) : (
                <form action={createShopItem} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="new-itemId">选择道具</Label>
                <ShopItemPicker
                  items={availableItems.map((item) => ({
                    id: item.id,
                    name: item.name,
                    rarity: item.rarity,
                    categoryName: item.category.name,
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-price">价格</Label>
                <Input id="new-price" name="price" type="number" min="0" defaultValue={0} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-currency">货币</Label>
                <select
                  id="new-currency"
                  name="currency"
                  defaultValue="gold"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-stock">库存（留空 = 不限）</Label>
                <Input id="new-stock" name="stock" type="number" min="0" placeholder="不限" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-sortOrder">排序（数字越小越靠前）</Label>
                <Input id="new-sortOrder" name="sortOrder" type="number" defaultValue={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-roundSlot">每日轮次（推荐）</Label>
                <select
                  id="new-roundSlot"
                  name="roundSlot"
                  defaultValue=""
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">不使用轮次（按下方具体时间）</option>
                  {ROUND_SLOT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  选择后每天自动按轮次上架，无需每天改日期；将忽略下方“上架/下架时间”。
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-startAt">上架时间（可选）</Label>
                <Input id="new-startAt" name="startAt" type="datetime-local" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-endAt">下架时间（可选）</Label>
                <Input id="new-endAt" name="endAt" type="datetime-local" />
              </div>
              <div className="space-y-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="new-note">备注（可选）</Label>
                <Textarea id="new-note" name="note" placeholder="例如：本周限时特价" rows={2} />
              </div>
              <div className="flex items-center gap-2 md:col-span-2 lg:col-span-3">
                <Checkbox id="new-enabled" name="enabled" defaultChecked />
                <Label htmlFor="new-enabled" className="font-medium">
                  立即启用
                </Label>
              </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <Button type="submit">添加到远行商人</Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
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
                          <Dialog>
                            <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
                              编辑
                            </DialogTrigger>
                            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>编辑商品：{shop.item.name}</DialogTitle>
                                <DialogDescription>保存后即时生效。</DialogDescription>
                              </DialogHeader>
                              <form action={updateShopItem} className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                <input type="hidden" name="id" value={shop.id} />
                                <div className="space-y-2">
                                  <Label htmlFor={`price-${shop.id}`}>价格</Label>
                                  <Input
                                    id={`price-${shop.id}`}
                                    name="price"
                                    type="number"
                                    min="0"
                                    defaultValue={shop.price}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`currency-${shop.id}`}>
                                    货币（当前：{getCurrencyLabel(shop.currency)}）
                                  </Label>
                                  <select
                                    id={`currency-${shop.id}`}
                                    name="currency"
                                    defaultValue={shop.currency}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                  >
                                    {CURRENCY_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`stock-${shop.id}`}>库存（留空 = 不限）</Label>
                                  <Input
                                    id={`stock-${shop.id}`}
                                    name="stock"
                                    type="number"
                                    min="0"
                                    defaultValue={shop.stock ?? ""}
                                    placeholder="不限"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`sort-${shop.id}`}>排序</Label>
                                  <Input
                                    id={`sort-${shop.id}`}
                                    name="sortOrder"
                                    type="number"
                                    defaultValue={shop.sortOrder}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`roundSlot-${shop.id}`}>每日轮次（推荐）</Label>
                                  <select
                                    id={`roundSlot-${shop.id}`}
                                    name="roundSlot"
                                    defaultValue={shop.roundSlot ? String(shop.roundSlot) : ""}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                  >
                                    <option value="">不使用轮次（按具体时间）</option>
                                    {ROUND_SLOT_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`startAt-${shop.id}`}>上架时间</Label>
                                  <Input
                                    id={`startAt-${shop.id}`}
                                    name="startAt"
                                    type="datetime-local"
                                    defaultValue={formatDateTimeLocal(shop.startAt)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`endAt-${shop.id}`}>下架时间</Label>
                                  <Input
                                    id={`endAt-${shop.id}`}
                                    name="endAt"
                                    type="datetime-local"
                                    defaultValue={formatDateTimeLocal(shop.endAt)}
                                  />
                                </div>
                                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                                  <Label htmlFor={`note-${shop.id}`}>备注</Label>
                                  <Textarea
                                    id={`note-${shop.id}`}
                                    name="note"
                                    rows={2}
                                    defaultValue={shop.note ?? ""}
                                    placeholder="例如：本周限时特价"
                                  />
                                </div>
                                <div className="flex items-center gap-2 md:col-span-2 lg:col-span-3">
                                  <Checkbox id={`enabled-${shop.id}`} name="enabled" defaultChecked={shop.enabled} />
                                  <Label htmlFor={`enabled-${shop.id}`} className="font-medium">
                                    启用此商品
                                  </Label>
                                </div>
                                <div className="md:col-span-2 lg:col-span-3">
                                  <Button type="submit" size="sm">
                                    保存修改
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
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
