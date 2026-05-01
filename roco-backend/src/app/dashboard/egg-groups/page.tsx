import {
  createEggGroup,
  createEggGroupElf,
  deleteEggGroup,
  deleteEggGroupElf,
  updateEggGroup,
  updateEggGroupElf,
} from "@/app/actions/egg-groups"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmSubmitButton } from "@/components/confirm-submit-button"
import { DashboardFormDialog } from "@/components/dashboard-form-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  DASHBOARD_PAGE_SIZE,
  DashboardPagination,
  parsePageParam,
} from "@/components/dashboard-pagination"
import { resolveImageUrl } from "@/lib/media"
import { prisma } from "@/lib/prisma"

interface EggGroupsPageProps {
  searchParams: Promise<{
    page?: string
  }>
}

function parseJsonArray(value: string | null) {
  if (!value) return [] as string[]

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : []
  } catch {
    return []
  }
}

export default async function EggGroupsPage({ searchParams }: EggGroupsPageProps) {
  const resolvedSearchParams = await searchParams
  const page = parsePageParam(resolvedSearchParams.page)
  const pageSize = DASHBOARD_PAGE_SIZE

  const [totalGroups, totalElves, totalMissing, missingImageElves, groups, groupOptions] = await Promise.all([
    prisma.eggGroup.count(),
    prisma.eggGroupElf.count(),
    prisma.eggGroupElf.count({ where: { OR: [{ image: null }, { image: "" }] } }),
    prisma.eggGroupElf.findMany({
      where: { OR: [{ image: null }, { image: "" }] },
      select: {
        name: true,
        group: { select: { name: true } },
      },
      orderBy: [{ group: { sortOrder: "asc" } }, { name: "asc" }],
      take: 200,
    }),
    prisma.eggGroup.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        elves: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.eggGroup.findMany({
      select: { id: true, name: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ])

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">蛋组管理</h1>
        <p className="mt-1 text-muted-foreground">
          管理洛克王国世界宠物蛋组对照表，数据用于小程序蛋组查询页面。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>蛋组数</CardTitle>
            <CardDescription>当前收录的组别</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalGroups}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>蛋组精灵</CardTitle>
            <CardDescription>按组保存的精灵快照</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalElves}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>待补图片</CardTitle>
            <CardDescription>未从 jingling.json 匹配到图片</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalMissing}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>蛋组与精灵维护</CardTitle>
            <CardDescription>新增与编辑均通过弹窗完成，适配移动端与 PC 端。</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <DashboardFormDialog
              triggerRender={<Button />}
              triggerChildren="新增蛋组"
              title="新增蛋组"
              description="手动新增组别，后续可持续扩展新蛋组。"
              contentClassName="sm:max-w-lg"
              formClassName="grid gap-3"
              action={createEggGroup}
              resetFormOnOpen
            >
              <div className="space-y-2">
                <Label htmlFor="new-group-id">蛋组 ID</Label>
                <Input id="new-group-id" name="id" required placeholder="例如：ancient_beast_group" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-group-name">蛋组名称</Label>
                <Input id="new-group-name" name="name" required placeholder="例如：远古兽组" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-group-sort">排序</Label>
                <Input id="new-group-sort" name="sortOrder" type="number" defaultValue={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-group-desc">描述</Label>
                <Textarea id="new-group-desc" name="description" rows={2} placeholder="可选" />
              </div>
              <Button type="submit" className="w-fit">
                新增蛋组
              </Button>
            </DashboardFormDialog>
            <DashboardFormDialog
              triggerRender={<Button variant="outline" />}
              triggerChildren="新增组内精灵"
              title="新增组内精灵"
              description="为已有蛋组添加精灵成员，可持续维护。"
              contentClassName="max-h-[85vh] overflow-y-auto sm:max-w-xl"
              formClassName="grid gap-3"
              action={createEggGroupElf}
              resetFormOnOpen
            >
              <div className="space-y-2">
                <Label htmlFor="new-elf-group">所属蛋组</Label>
                <select
                  id="new-elf-group"
                  name="groupId"
                  required
                  defaultValue=""
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="" disabled>
                    -- 选择蛋组 --
                  </option>
                  {groupOptions.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-elf-name">精灵名称</Label>
                <Input id="new-elf-name" name="name" required placeholder="例如：迪莫" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-elf-image">图片路径</Label>
                <Input id="new-elf-image" name="image" placeholder="/imgs/jingling/迪莫.webp（可选）" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-elf-attr">属性标签</Label>
                <Input id="new-elf-attr" name="attrNames" placeholder="火, 恶魔（逗号分隔，可选）" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-elf-attributes">属性文本</Label>
                <Input id="new-elf-attributes" name="attributes" placeholder="可选，原始属性文案" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-elf-sort">排序</Label>
                <Input id="new-elf-sort" name="sortOrder" type="number" defaultValue={0} />
              </div>
              <Button type="submit" className="w-fit">
                添加精灵
              </Button>
            </DashboardFormDialog>
          </div>
        </CardHeader>
      </Card>

      {totalGroups === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>暂无蛋组数据</CardTitle>
            <CardDescription>
              请先执行 npm run db:push，然后执行 npm run db:import-egg-groups 初始化蛋组。
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {groups.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  当前页没有数据，请尝试切换其他页码。
                </CardContent>
              </Card>
            ) : (
              groups.map((group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle>{group.name}</CardTitle>
                        <CardDescription>{group.description || "洛克王国世界宠物蛋组对照"}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{group.elves.length} 只精灵</Badge>
                        <DashboardFormDialog
                          triggerRender={<Button type="button" size="sm" variant="outline" />}
                          triggerChildren="编辑蛋组"
                          title={`编辑蛋组：${group.name}`}
                          description="修改蛋组基础信息。"
                          contentClassName="sm:max-w-lg"
                          formClassName="grid gap-3"
                          action={updateEggGroup}
                        >
                          <input type="hidden" name="id" value={group.id} />
                          <div className="space-y-2">
                            <Label htmlFor={`group-name-${group.id}`}>蛋组名称</Label>
                            <Input id={`group-name-${group.id}`} name="name" defaultValue={group.name} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`group-sort-${group.id}`}>排序</Label>
                            <Input
                              id={`group-sort-${group.id}`}
                              name="sortOrder"
                              type="number"
                              defaultValue={group.sortOrder}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`group-desc-${group.id}`}>描述</Label>
                            <Input
                              id={`group-desc-${group.id}`}
                              name="description"
                              defaultValue={group.description ?? ""}
                              placeholder="可选"
                            />
                          </div>
                          <Button type="submit" size="sm" className="w-fit">
                            保存蛋组
                          </Button>
                        </DashboardFormDialog>
                        <form action={deleteEggGroup}>
                          <input type="hidden" name="id" value={group.id} />
                          <ConfirmSubmitButton
                            type="submit"
                            size="sm"
                            variant="destructive"
                            confirmMessage={`确认删除蛋组「${group.name}」吗？此操作会同时删除组内精灵。`}
                          >
                            删除蛋组
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>精灵</TableHead>
                            <TableHead>属性</TableHead>
                            <TableHead>排序</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.elves.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                                暂无组内精灵
                              </TableCell>
                            </TableRow>
                          ) : null}
                      {group.elves.map((elf) => {
                        const imageUrl = resolveImageUrl(elf.image)
                        const attrNames = parseJsonArray(elf.attrNames)

                        return (
                          <TableRow key={elf.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                              {imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={imageUrl} alt={elf.name} className="h-12 w-12 rounded-lg object-contain" loading="lazy" decoding="async" />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg border text-xs text-muted-foreground">
                                  无图
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate font-medium">{elf.name}</p>
                              </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {attrNames.length ? (
                                  attrNames.map((attr) => (
                                    <Badge key={attr} variant="outline" className="text-xs">
                                      {attr}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">暂无属性</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{elf.sortOrder}</TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                              <DashboardFormDialog
                                triggerRender={<Button type="button" size="sm" variant="outline" />}
                                triggerChildren="编辑"
                                title={`编辑精灵：${elf.name}`}
                                description="调整该精灵在当前蛋组下的展示信息。"
                                contentClassName="max-h-[85vh] overflow-y-auto sm:max-w-xl"
                                formClassName="grid gap-3"
                                action={updateEggGroupElf}
                              >
                                <input type="hidden" name="id" value={elf.id} />
                                <input type="hidden" name="groupId" value={group.id} />
                                <div className="space-y-2">
                                  <Label htmlFor={`elf-name-${elf.id}`}>精灵名称</Label>
                                  <Input id={`elf-name-${elf.id}`} name="name" defaultValue={elf.name} required />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`elf-image-${elf.id}`}>图片路径</Label>
                                  <Input id={`elf-image-${elf.id}`} name="image" defaultValue={elf.image ?? ""} placeholder="图片路径" />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`elf-attr-${elf.id}`}>属性标签</Label>
                                  <Input id={`elf-attr-${elf.id}`} name="attrNames" defaultValue={attrNames.join(", ")} placeholder="属性标签" />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`elf-attributes-${elf.id}`}>属性文本</Label>
                                  <Input id={`elf-attributes-${elf.id}`} name="attributes" defaultValue={elf.attributes ?? ""} placeholder="属性文本" />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`elf-sort-${elf.id}`}>排序</Label>
                                  <Input id={`elf-sort-${elf.id}`} name="sortOrder" type="number" defaultValue={elf.sortOrder} />
                                </div>
                                <Button type="submit" size="sm" className="w-fit">
                                  保存
                                </Button>
                              </DashboardFormDialog>
                            <form action={deleteEggGroupElf}>
                              <input type="hidden" name="id" value={elf.id} />
                              <ConfirmSubmitButton
                                type="submit"
                                size="sm"
                                variant="destructive"
                                confirmMessage={`确认移除精灵「${elf.name}」吗？`}
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
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DashboardPagination
            page={page}
            pageSize={pageSize}
            total={totalGroups}
            basePath="/dashboard/egg-groups"
          />
        </>
      )}

      {missingImageElves.length ? (
        <Card>
          <CardHeader>
            <CardTitle>未匹配图片的名称</CardTitle>
            <CardDescription>
              这些名称可能需要在 jingling.json 中确认写法（最多展示 200 条，
              当前共 {totalMissing} 条）。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>蛋组</TableHead>
                  <TableHead>名称</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missingImageElves.map((item, index) => (
                  <TableRow key={`${item.group.name}-${item.name}-${index}`}>
                    <TableCell>{item.group.name}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
