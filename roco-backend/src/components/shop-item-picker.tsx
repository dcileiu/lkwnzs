"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type ShopItemOption = {
  id: string
  name: string
  rarity: string | null
  categoryName: string
}

interface ShopItemPickerProps {
  items: ShopItemOption[]
  name?: string
}

function buildItemLabel(item: ShopItemOption) {
  return `[${item.categoryName}] ${item.name}${item.rarity ? ` · ${item.rarity}` : ""}`
}

export function ShopItemPicker({ items, name = "itemId" }: ShopItemPickerProps) {
  const [query, setQuery] = React.useState("")
  const [selectedId, setSelectedId] = React.useState("")

  const selectedItem = React.useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId],
  )

  const filteredItems = React.useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return items.slice(0, 120)

    return items
      .filter((item) => {
        const text = `${item.name} ${item.categoryName} ${item.rarity || ""}`.toLowerCase()
        return text.includes(keyword)
      })
      .slice(0, 120)
  }, [items, query])

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={selectedId} />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="输入道具名/分类/品质搜索"
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
      />
      <div className="max-h-52 overflow-auto rounded-md border">
        {filteredItems.length ? (
          <div className="p-1">
            {filteredItems.map((item) => {
              const active = item.id === selectedId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "block w-full rounded px-2 py-1.5 text-left text-sm transition-colors",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  {buildItemLabel(item)}
                </button>
              )
            })}
          </div>
        ) : (
          <p className="px-3 py-4 text-sm text-muted-foreground">没有匹配的道具</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {selectedItem ? `已选择：${buildItemLabel(selectedItem)}` : "请先搜索并点击选择一个道具"}
      </p>
    </div>
  )
}
