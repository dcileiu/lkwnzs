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
  helperText?: string
  helperTextRenderer?: (selectedOption: SearchableOption | null) => string
}

export function SearchableSelect({
  name,
  options,
  placeholder = "输入关键词搜索",
  defaultValue = "",
  noOptionsText = "没有匹配选项",
  maxVisibleOptions = 120,
  helperText,
  helperTextRenderer,
}: SearchableSelectProps) {
  const OPTION_ROW_HEIGHT = 34
  const OPTION_LIST_PADDING = 8
  const PANEL_MARGIN = 4
  const PANEL_MAX_HEIGHT = 208

  const initialSelectedOption = options.find((option) => option.value === defaultValue) || null
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const [open, setOpen] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const [openUpward, setOpenUpward] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(defaultValue)
  const [query, setQuery] = React.useState(initialSelectedOption ? initialSelectedOption.label : "")

  const selectedOption = React.useMemo(() => {
    return options.find((option) => option.value === selectedValue) || null
  }, [options, selectedValue])

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

  const updateDropdownPlacement = React.useCallback((optionCount: number) => {
    if (!inputRef.current) return

    const rect = inputRef.current.getBoundingClientRect()
    const estimatedHeight = Math.min(
      Math.max(optionCount, 1) * OPTION_ROW_HEIGHT + OPTION_LIST_PADDING,
      PANEL_MAX_HEIGHT,
    )
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const shouldOpenUpward = spaceBelow < estimatedHeight + PANEL_MARGIN && spaceAbove > spaceBelow

    setOpenUpward((prev) => (prev === shouldOpenUpward ? prev : shouldOpenUpward))
  }, [])

  function restoreSelectedLabel() {
    setQuery(selectedOption ? selectedOption.label : "")
  }

  function handleFocus() {
    setFocused(true)
    if (selectedOption) {
      setQuery("")
    }
    setOpen(true)
    updateDropdownPlacement(filteredOptions.length)
  }

  function handleBlur() {
    setTimeout(() => {
      setFocused(false)
      setOpen(false)
      restoreSelectedLabel()
    }, 120)
  }

  const inputPlaceholder = focused
    ? (selectedOption?.label || placeholder)
    : (selectedOption ? "" : placeholder)
  const resolvedHelperText = helperTextRenderer ? helperTextRenderer(selectedOption) : helperText

  React.useEffect(() => {
    if (!open) return

    const handleViewportChange = () => {
      updateDropdownPlacement(filteredOptions.length)
    }

    const rafId = window.requestAnimationFrame(handleViewportChange)
    window.addEventListener("resize", handleViewportChange)
    window.addEventListener("scroll", handleViewportChange, true)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener("resize", handleViewportChange)
      window.removeEventListener("scroll", handleViewportChange, true)
    }
  }, [filteredOptions.length, open, updateDropdownPlacement])

  return (
    <div
      ref={rootRef}
      className={cn("relative space-y-2", open ? "z-[9998]" : "z-0")}
    >
      <input type="hidden" name={name} value={selectedValue} />
      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
            updateDropdownPlacement(
              options
                .filter((option) => {
                  const keyword = event.target.value.trim().toLowerCase()
                  if (!keyword) return true
                  const source = `${option.label} ${option.keywords || ""}`.toLowerCase()
                  return source.includes(keyword)
                })
                .slice(0, maxVisibleOptions).length,
            )
          }}
          placeholder={inputPlaceholder}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <ChevronDownIcon
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-transform",
            open ? "rotate-180" : "rotate-0",
          )}
        />
        <div
          className={cn(
            "absolute left-0 right-0 z-[9999] rounded-md border bg-background shadow-sm transition-all",
            openUpward ? "bottom-full mb-1" : "top-full mt-1",
            open ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <div className="max-h-52 overflow-auto">
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
                        setFocused(false)
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
      </div>
      {resolvedHelperText ? (
        <p className="text-xs text-muted-foreground">{resolvedHelperText}</p>
      ) : null}
    </div>
  )
}

