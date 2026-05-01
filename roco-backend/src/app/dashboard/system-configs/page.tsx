import {
  createSystemConfig,
  deleteSystemConfig,
  updateSystemConfig,
} from "@/app/actions/system-configs"
import { ConfirmSubmitButton } from "@/components/confirm-submit-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function SystemConfigsPage() {
  const configs = await prisma.systemConfig.findMany({
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
  })

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">系统配置</h1>
        <p className="mt-1 text-muted-foreground">
          用于维护公告与其他全局配置。每条配置包含 ID、内容、显隐状态与更新时间。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新增配置</CardTitle>
          <CardDescription>配置 ID 为数据库自增，无需手动填写。</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createSystemConfig} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-config-visible">显示状态</Label>
              <div className="flex h-9 items-center gap-2 rounded-md border px-3">
                <Checkbox id="new-config-visible" name="isVisible" defaultChecked />
                <Label htmlFor="new-config-visible">显示</Label>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="new-config-content">内容</Label>
              <Textarea id="new-config-content" name="content" rows={3} placeholder="公告或其他配置内容，可留空" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">新增配置</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>配置列表</CardTitle>
          <CardDescription>共 {configs.length} 条配置。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>内容</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    暂无配置，请先新增。
                  </TableCell>
                </TableRow>
              ) : (
                configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-mono text-xs">#{config.id}</TableCell>
                    <TableCell>
                      {config.isVisible ? (
                        <Badge className="bg-emerald-600">显示中</Badge>
                      ) : (
                        <Badge variant="secondary">已隐藏</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[420px]">
                      <form action={updateSystemConfig} className="grid gap-2">
                        <input type="hidden" name="id" value={config.id} />
                        <Textarea
                          name="content"
                          rows={2}
                          defaultValue={config.content ?? ""}
                          placeholder="可留空"
                        />
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`visible-${config.id}`}
                            name="isVisible"
                            defaultChecked={config.isVisible}
                          />
                          <Label htmlFor={`visible-${config.id}`}>显示</Label>
                        </div>
                        <div>
                          <Button type="submit" size="sm" variant="outline">
                            保存
                          </Button>
                        </div>
                      </form>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {config.updatedAt.toLocaleString("zh-CN", { hour12: false })}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <form action={deleteSystemConfig}>
                          <input type="hidden" name="id" value={config.id} />
                          <ConfirmSubmitButton
                            type="submit"
                            size="sm"
                            variant="destructive"
                            confirmMessage={`确认删除配置「${config.id}」吗？`}
                          >
                            删除
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
