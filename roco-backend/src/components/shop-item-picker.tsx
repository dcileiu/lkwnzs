"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

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
  /** 编辑已有上架记录时传入当前道具 id，保证隐藏域与可选列表一致 */
  defaultItemId?: string | null
}

function buildItemLabel(item: ShopItemOption) {
  return `[${item.categoryName}] ${item.name}${item.rarity ? ` · ${item.rarity}` : ""}`
}

export function ShopItemPicker({ items, name = "itemId", defaultItemId = "" }: ShopItemPickerProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const [query, setQuery] = React.useState("")
  const [selectedId, setSelectedId] = React.useState(() => defaultItemId ?? "")
  const [open, setOpen] = React.useState(false)

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

  React.useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleDocumentClick)
    return () => document.removeEventListener("mousedown", handleDocumentClick)
  }, [])

  function handleSelect(item: ShopItemOption) {
    setSelectedId(item.id)
    setQuery(item.name)
    setOpen(false)
  }

  function handleFocus() {
    setOpen(true)
  }

  return (
    <div ref={rootRef} className="space-y-2">
      <input type="hidden" name={name} value={selectedId} />
      <div className="relative">
        <input
          value={query}
          onFocus={handleFocus}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          placeholder="输入道具名/分类/品质搜索"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <ChevronDownIcon
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-transform",
            open ? "rotate-180" : "rotate-0",
          )}
        />
      </div>
      <div
        className={cn(
          "max-h-52 overflow-auto rounded-md border bg-background shadow-sm transition-all",
          open ? "opacity-100" : "pointer-events-none max-h-0 overflow-hidden border-transparent opacity-0",
        )}
      >
        {filteredItems.length > 0 ? (
          <div className="p-1">
            {filteredItems.map((item) => {
              const active = item.id === selectedId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
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
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">没有匹配的道具</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {selectedItem ? `已选择：${buildItemLabel(selectedItem)}` : "请先搜索并点击选择一个道具"}
      </p>
    </div>
  )
}
