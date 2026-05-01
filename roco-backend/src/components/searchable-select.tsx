"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type SearchableOption = {
  value: string
  label: string
  keywords?: string
}

type SearchableSelectProps = {
  name: string
  options: SearchableOption[]
  placeholder?: string
  defaultValue?: string
  noOptionsText?: string
  maxVisibleOptions?: number
}

export function SearchableSelect({
  name,
  options,
  placeholder = "请选择",
  defaultValue = "",
  noOptionsText = "没有匹配选项",
  maxVisibleOptions = 120,
}: SearchableSelectProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [selectedValue, setSelectedValue] = React.useState(defaultValue)

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === selectedValue) || null,
    [options, selectedValue],
  )

  React.useEffect(() => {
    if (selectedOption) {
      setQuery(selectedOption.label)
    }
  }, [selectedOption])

  React.useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  const filteredOptions = React.useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return options.slice(0, maxVisibleOptions)

    return options
      .filter((option) => {
        const source = `${option.label} ${option.keywords || ""}`.toLowerCase()
        return source.includes(keyword)
      })
      .slice(0, maxVisibleOptions)
  }, [maxVisibleOptions, options, query])

  return (
    <div ref={rootRef} className="space-y-2">
      <input type="hidden" name={name} value={selectedValue} />
      <div className="relative">
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          placeholder={placeholder}
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
        {filteredOptions.length > 0 ? (
          <div className="p-1">
            {filteredOptions.map((option) => {
              const active = option.value === selectedValue
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSelectedValue(option.value)
                    setQuery(option.label)
                    setOpen(false)
                  }}
                  className={cn(
                    "block w-full rounded px-2 py-1.5 text-left text-sm transition-colors",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        ) : (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">{noOptionsText}</p>
        )}
      </div>
    </div>
  )
}

