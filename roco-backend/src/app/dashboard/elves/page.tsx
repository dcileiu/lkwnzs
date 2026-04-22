import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusIcon } from "lucide-react"

export default async function ElvesPage() {
  const elves = await prisma.elf.findMany({
    orderBy: [{ detailQueryCount: "desc" }, { createdAt: "desc" }],
    include: {
      _count: {
        select: {
          images: true,
        },
      },
    },
  })

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">图鉴管理</h1>
          <p className="mt-1 text-muted-foreground">
            Manage elf cover images, galleries, base stats, grouping tags, and hot ranking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/elves/new">
              <PlusIcon className="mr-2 h-4 w-4" />
              新增精灵
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>全部精灵</CardTitle>
          <CardDescription>{elves.length} 只精灵在册</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>主图</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>组别</TableHead>
                <TableHead>属性</TableHead>
                <TableHead>身高</TableHead>
                <TableHead>体重</TableHead>
                <TableHead>种族值</TableHead>
                <TableHead className="text-right">详情查询</TableHead>
                <TableHead className="text-right">图集数</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {elves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                    暂无精灵，请先新增。
                  </TableCell>
                </TableRow>
              ) : (
                elves.map((elf) => (
                  <TableRow key={elf.id}>
                    <TableCell>
                      {elf.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={elf.avatar}
                          alt={elf.name}
                          className="h-12 w-12 rounded-lg border object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border text-xs text-muted-foreground">
                          无图
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{elf.name}</TableCell>
                    <TableCell>
                      {elf.group ? <Badge variant="secondary">{elf.group}</Badge> : <span className="text-xs text-muted-foreground">未分组</span>}
                    </TableCell>
                    <TableCell>{elf.height ?? "-"}</TableCell>
                    <TableCell>{elf.weight ?? "-"}</TableCell>
                    <TableCell>{elf.raceValue ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{elf.element}</Badge>
                    </TableCell>
                    <TableCell>{elf.height ?? "-"}</TableCell>
                    <TableCell>{elf.weight ?? "-"}</TableCell>
                    <TableCell>{elf.raceValue ?? "-"}</TableCell>
                    <TableCell className="text-right">{elf.detailQueryCount}</TableCell>
                    <TableCell className="text-right">{elf._count.images}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="mr-2">
                        编辑
                      </Button>
                      <Button variant="destructive" size="sm">
                        删除
                      </Button>
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
