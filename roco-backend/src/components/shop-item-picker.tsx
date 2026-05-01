"use client"

import { SearchableSelect } from "@/components/searchable-select"

type ShopItemOption = {
  id: string
  name: string
  rarity: string | null
  categoryName: string
}

interface ShopItemPickerProps {
  items: ShopItemOption[]
  name?: string
  /** 编辑已有上架记录时传入当前道具 id，保证隐藏域与可选列表一致 */
  defaultItemId?: string | null
}

function buildItemLabel(item: ShopItemOption) {
  return `[${item.categoryName}] ${item.name}${item.rarity ? ` · ${item.rarity}` : ""}`
}

export function ShopItemPicker({ items, name = "itemId", defaultItemId = "" }: ShopItemPickerProps) {
  return (
    <SearchableSelect
      name={name}
      defaultValue={defaultItemId ?? ""}
      options={items.map((item) => ({
        value: item.id,
        label: buildItemLabel(item),
        keywords: `${item.name} ${item.categoryName} ${item.rarity || ""}`,
      }))}
      placeholder="输入道具名/分类/品质搜索"
      noOptionsText="没有匹配的道具"
      helperTextRenderer={(selectedOption) =>
        selectedOption ? `已选择：${selectedOption.label}` : "请先搜索并点击选择一个道具"
      }
    />
  )
}
