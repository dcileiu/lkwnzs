import Link from "next/link"
import { createEvolutionChain, addEvolutionLink, deleteEvolutionBranch } from "@/app/actions/evolutions"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DASHBOARD_PAGE_SIZE,
  DashboardPagination,
  parsePageParam,
} from "@/components/dashboard-pagination"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { resolveImageUrl } from "@/lib/media"
import { PlusIcon } from "lucide-react"

interface EvolutionsPageProps {
  searchParams: Promise<{
    page?: string
  }>
}

type EvolutionLink = {
  id: string
  parentElfId: string | null
  childElfId: string
  stage: number
  sortOrder: number
  requirement: string | null
  note: string | null
  childElf: {
    id: string
    name: string
    rarity: string
    element: string
    avatar: string | null
  }
}

type EvolutionTreeNode = EvolutionLink & {
  children: EvolutionTreeNode[]
}

function buildEvolutionTree(links: EvolutionLink[]) {
  const bucket = new Map<string | null, EvolutionLink[]>()

  for (const link of links) {
    const group = bucket.get(link.parentElfId) ?? []
    group.push(link)
    bucket.set(link.parentElfId, group)
  }

  for (const group of bucket.values()) {
    group.sort((left, right) => {
      if (left.stage !== right.stage) return left.stage - right.stage
      if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder
      return left.childElf.name.localeCompare(right.childElf.name, "zh-CN")
    })
  }

  const walk = (parentElfId: string | null): EvolutionTreeNode[] =>
    (bucket.get(parentElfId) ?? []).map((link) => ({
      ...link,
      children: walk(link.childElfId),
    }))

  return walk(null)
}

function TreeBranch({ node }: { node: EvolutionTreeNode }) {
  const avatarUrl = resolveImageUrl(node.childElf.avatar)
  return (
    <li className="relative list-none pl-6">
      <div className="absolute left-2 top-0 h-full w-px bg-border" />
      <div className="absolute left-2 top-7 h-px w-4 bg-border" />
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={node.childElf.name}
                className="h-12 w-12 rounded-lg border object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border text-xs text-muted-foreground">
                无图
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{node.childElf.name}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  第 {node.stage} 阶段
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                  {node.childElf.element}
                </span>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                  {node.childElf.rarity}
                </span>
              </div>
              {node.requirement ? (
                <p className="mt-1 text-sm text-muted-foreground">进化条件：{node.requirement}</p>
              ) : null}
              {node.note ? (
                <p className="mt-1 text-xs text-muted-foreground">{node.note}</p>
              ) : null}
            </div>
          </div>
          <form action={deleteEvolutionBranch}>
            <input type="hidden" name="linkId" value={node.id} />
            <Button variant="destructive" size="sm" type="submit">
              删除分支
            </Button>
          </form>
        </div>
      </div>

      {node.children.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {node.children.map((child) => (
            <TreeBranch key={child.id} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export default async function EvolutionsPage({ searchParams }: EvolutionsPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parsePageParam(resolvedSearchParams.page)
  const pageSize = DASHBOARD_PAGE_SIZE

  const [totalChains, chains, elves] = await Promise.all([
    prisma.evolutionChain.count(),
    prisma.evolutionChain.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        links: {
          orderBy: [{ stage: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            childElf: {
              select: {
                id: true,
                name: true,
                rarity: true,
                element: true,
                avatar: true,
              },
            },
          },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.elf.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
  ])

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">进化路线管理</h1>
          <p className="mt-1 text-muted-foreground">
            后台按多级菜单树来维护进化链，小程序详情页会按进化树渲染。共 {totalChains} 条进化链，每页 {pageSize} 条。
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/elves">
            <PlusIcon className="mr-2 h-4 w-4" />
            返回精灵管理
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>创建新进化链</CardTitle>
            <CardDescription>
              先选根节点精灵，系统会自动创建第一阶段，后续再继续往下挂子节点。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createEvolutionChain} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">链路名称</Label>
                <Input id="name" name="name" placeholder="例如：迪莫进化线" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rootElfId">根节点精灵</Label>
                <select
                  id="rootElfId"
                  name="rootElfId"
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    选择第一阶段精灵
                  </option>
                  {elves.map((elf) => (
                    <option key={elf.id} value={elf.id}>
                      {elf.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">链路备注</Label>
                <Textarea id="note" name="note" className="min-h-[100px]" placeholder="比如：光系主线，后续有双分支。" />
              </div>

              <Button type="submit" className="w-full">
                创建进化链
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {totalChains === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                还没有进化链，先在左侧创建第一条吧。
              </CardContent>
            </Card>
          ) : chains.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                当前页没有数据，请尝试切换其他页码。
              </CardContent>
            </Card>
          ) : (
            chains.map((chain) => {
              const tree = buildEvolutionTree(chain.links as EvolutionLink[])

              return (
                <Card key={chain.id}>
                  <CardHeader>
                    <CardTitle>{chain.name || "未命名进化链"}</CardTitle>
                    <CardDescription>
                      {chain.note || `当前共有 ${chain.links.length} 个进化节点。`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                      <div className="rounded-2xl border bg-muted/20 p-4">
                        <div className="mb-3 text-sm font-medium text-muted-foreground">树形预览</div>
                        <ul className="space-y-4">
                          {tree.map((node) => (
                            <TreeBranch key={node.id} node={node} />
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-2xl border p-4">
                        <div className="mb-3 text-sm font-medium">添加下一级进化</div>
                        <form action={addEvolutionLink} className="space-y-4">
                          <input type="hidden" name="chainId" value={chain.id} />

                          <div className="space-y-2">
                            <Label htmlFor={`parent-${chain.id}`}>父节点精灵</Label>
                            <select
                              id={`parent-${chain.id}`}
                              name="parentElfId"
                              required
                              defaultValue=""
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                              <option value="" disabled>
                                选择当前要展开的节点
                              </option>
                              {chain.links.map((link) => (
                                <option key={link.id} value={link.childElfId}>
                                  第 {link.stage} 阶段 / {link.childElf.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`child-${chain.id}`}>子节点精灵</Label>
                            <select
                              id={`child-${chain.id}`}
                              name="childElfId"
                              required
                              defaultValue=""
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                              <option value="" disabled>
                                选择新增的进化形态
                              </option>
                              {elves.map((elf) => (
                                <option key={elf.id} value={elf.id}>
                                  {elf.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`sort-${chain.id}`}>同级排序</Label>
                            <Input id={`sort-${chain.id}`} name="sortOrder" type="number" defaultValue="0" min="0" />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`requirement-${chain.id}`}>进化条件</Label>
                            <Input id={`requirement-${chain.id}`} name="requirement" placeholder="例如：等级 32 / 使用道具 / 分支选择" />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`note-${chain.id}`}>备注</Label>
                            <Textarea id={`note-${chain.id}`} name="note" className="min-h-[90px]" placeholder="补充说明这条进化边的特殊规则。" />
                          </div>

                          <Button type="submit" className="w-full">
                            保存子节点
                          </Button>
                        </form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}

          <DashboardPagination
            page={page}
            pageSize={pageSize}
            total={totalChains}
            basePath="/dashboard/evolutions"
          />
        </div>
      </div>
    </div>
  )
}
