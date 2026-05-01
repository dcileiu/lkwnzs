"use client"

import { createShopItem, updateShopItem } from "@/app/actions/shop-items"
import { DashboardFormDialog } from "@/components/dashboard-form-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"

import {
  SHOP_CURRENCY_OPTIONS,
  SHOP_ROUND_SLOT_OPTIONS,
  formatDateTimeLocal,
  getCurrencyLabel,
} from "./shop-shared"

type ItemOption = {
  id: string
  name: string
  rarity: string | null
  categoryName: string
}

type CreateShopItemDialogProps = {
  availableItems: ItemOption[]
}

export function CreateShopItemDialog({ availableItems }: CreateShopItemDialogProps) {
  if (availableItems.length === 0) {
    return (
      <Dialog>
        <DialogTrigger render={<Button />}>新增商品</DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>新增远行商人商品</DialogTitle>
            <DialogDescription>从已存在道具中新增一条上架记录。</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">尚无道具数据，请先在「道具管理」中导入道具。</p>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <DashboardFormDialog
      triggerRender={<Button />}
      triggerChildren="新增商品"
      title="新增远行商人商品"
      description="从已存在道具中新增一条上架记录。"
      contentClassName="max-h-[85vh] overflow-y-auto sm:max-w-3xl"
      formClassName="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      action={createShopItem}
      resetFormOnOpen
    >
      <div className="space-y-2 md:col-span-2 lg:col-span-3">
        <Label htmlFor="new-itemId">选择道具</Label>
        <ShopItemPicker items={availableItems} defaultItemId="" />
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
          {SHOP_CURRENCY_OPTIONS.map((option) => (
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
          {SHOP_ROUND_SLOT_OPTIONS.map((option) => (
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
    </DashboardFormDialog>
  )
}

type EditShopRow = {
  id: string
  price: number
  currency: string
  stock: number | null
  sortOrder: number
  roundSlot: number | null
  startAt: Date | null
  endAt: Date | null
  note: string | null
  enabled: boolean
  item: {
    id: string
    name: string
  }
}

type EditShopItemDialogProps = {
  shop: EditShopRow
  itemOptions: ItemOption[]
}

export function EditShopItemDialog({ shop, itemOptions }: EditShopItemDialogProps) {
  return (
    <DashboardFormDialog
      triggerRender={<Button type="button" variant="outline" size="sm" />}
      triggerChildren="编辑"
      title={`编辑商品：${shop.item.name}`}
      description="可更换关联道具并修改价格与时间；保存后即时生效。"
      contentClassName="max-h-[85vh] overflow-y-auto sm:max-w-3xl"
      formClassName="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
      action={updateShopItem}
    >
      <input type="hidden" name="id" value={shop.id} />
      <div className="space-y-2 md:col-span-2 lg:col-span-3">
        <Label htmlFor={`item-${shop.id}`}>选择道具</Label>
        <ShopItemPicker
          key={`${shop.id}-${shop.item.id}`}
          items={itemOptions}
          defaultItemId={shop.item.id}
        />
      </div>
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
        <Label htmlFor={`currency-${shop.id}`}>货币（当前：{getCurrencyLabel(shop.currency)}）</Label>
        <select
          id={`currency-${shop.id}`}
          name="currency"
          defaultValue={shop.currency}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {SHOP_CURRENCY_OPTIONS.map((option) => (
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
        <Input id={`sort-${shop.id}`} name="sortOrder" type="number" defaultValue={shop.sortOrder} />
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
          {SHOP_ROUND_SLOT_OPTIONS.map((option) => (
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
    </DashboardFormDialog>
  )
}
