import Link from "next/link"

import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

export const DASHBOARD_PAGE_SIZE = 20

type DashboardPaginationProps = {
  page: number
  pageSize: number
  total: number
  basePath: string
  query?: Record<string, string | number | null | undefined>
}

function buildHref(
  basePath: string,
  query: DashboardPaginationProps["query"],
  page: number,
) {
  const params = new URLSearchParams()
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined) continue
      const stringValue = String(value).trim()
      if (!stringValue) continue
      params.set(key, stringValue)
    }
  }
  if (page > 1) params.set("page", String(page))
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

function buildPageList(current: number, totalPages: number) {
  const pages = new Set<number>()
  pages.add(1)
  pages.add(totalPages)
  for (let offset = -2; offset <= 2; offset += 1) {
    const candidate = current + offset
    if (candidate >= 1 && candidate <= totalPages) pages.add(candidate)
  }

  const sorted = Array.from(pages).sort((a, b) => a - b)
  const result: Array<number | "ellipsis-left" | "ellipsis-right"> = []
  for (let index = 0; index < sorted.length; index += 1) {
    const value = sorted[index]
    if (index > 0) {
      const previous = sorted[index - 1]
      if (value - previous > 1) {
        result.push(previous < current ? "ellipsis-left" : "ellipsis-right")
      }
    }
    result.push(value)
  }
  return result
}

export function DashboardPagination({
  page,
  pageSize,
  total,
  basePath,
  query,
}: DashboardPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const pages = buildPageList(safePage, totalPages)
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = Math.min(total, safePage * pageSize)
  const hasPrev = safePage > 1
  const hasNext = safePage < totalPages

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-sm text-muted-foreground">
        共 {total} 条 · 第 {safePage} / {totalPages} 页
        {total > 0 ? `（当前 ${start}-${end}）` : ""}
      </p>

      <div className="flex flex-wrap items-center gap-1">
        {hasPrev ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildHref(basePath, query, safePage - 1)} aria-label="上一页">
              <ChevronLeftIcon className="h-4 w-4" />
              上一页
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled aria-label="上一页">
            <ChevronLeftIcon className="h-4 w-4" />
            上一页
          </Button>
        )}

        {pages.map((entry, index) => {
          if (entry === "ellipsis-left" || entry === "ellipsis-right") {
            return (
              <span
                key={`${entry}-${index}`}
                className="px-2 text-sm text-muted-foreground"
              >
                …
              </span>
            )
          }
          const isCurrent = entry === safePage
          if (isCurrent) {
            return (
              <Button
                key={entry}
                variant="default"
                size="sm"
                disabled
                aria-current="page"
                aria-label={`第 ${entry} 页（当前）`}
                className="min-w-9 px-2"
              >
                {entry}
              </Button>
            )
          }
          return (
            <Button
              key={entry}
              variant="outline"
              size="sm"
              asChild
              className="min-w-9 px-2"
            >
              <Link
                href={buildHref(basePath, query, entry)}
                aria-label={`第 ${entry} 页`}
              >
                {entry}
              </Link>
            </Button>
          )
        })}

        {hasNext ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildHref(basePath, query, safePage + 1)} aria-label="下一页">
              下一页
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled aria-label="下一页">
            下一页
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function parsePageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw
  const parsed = Number.parseInt(value || "1", 10)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return parsed
}
