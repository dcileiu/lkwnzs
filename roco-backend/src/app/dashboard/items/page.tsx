import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { readItemsData } from "@/lib/game-data"

export default async function ItemsPage() {
  const { filename, items } = await readItemsData()

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">道具管理</h1>
        <p className="mt-1 text-muted-foreground">用于维护道具基础信息（名称、分类、图标等）。</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>道具数据</CardTitle>
          <CardDescription>
            {filename ? `来源文件：data/${filename}` : "未发现道具数据文件（支持 data/daoju.json、data/道具.json、data/items.json）"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="rounded-lg border p-6 text-sm text-muted-foreground">暂无可展示的道具数据。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>编号</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>品质</TableHead>
                  <TableHead>图标</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => {
                  const id = item.no ?? item.id ?? `ITEM-${String(index + 1).padStart(3, "0")}`
                  const icon = (typeof item.icon === "string" && item.icon) || (typeof item.image === "string" ? item.image : "")
                  return (
                    <TableRow key={`${id}-${index}`}>
                      <TableCell>{id}</TableCell>
                      <TableCell className="font-medium">{item.name ?? "未命名道具"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.type ?? "未分类"}</Badge>
                      </TableCell>
                      <TableCell>{item.quality ?? "-"}</TableCell>
                      <TableCell>
                        {icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={String(icon)} alt={String(item.name ?? "道具图标")} className="h-10 w-10 rounded border object-cover" />
                        ) : (
                          <span className="text-xs text-muted-foreground">无图标</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
