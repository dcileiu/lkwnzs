import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusIcon } from "lucide-react"

export default async function ElvesPage() {
  const elves = await prisma.elf.findMany({
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">图鉴管理 (Elves)</h1>
          <p className="text-muted-foreground mt-1">
            Manage your Pokedex entries and Pet base stats here.
          </p>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          新增精灵
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>所有精灵</CardTitle>
          <CardDescription>
            {elves.length} 只精灵在册
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称 (Name)</TableHead>
                <TableHead>属性 (Element)</TableHead>
                <TableHead>稀有度 (Rarity)</TableHead>
                <TableHead className="text-right">种族值 (Total Stats)</TableHead>
                <TableHead>操作 (Actions)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {elves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    暂无精灵，请点击右上角新增
                  </TableCell>
                </TableRow>
              ) : (
                elves.map((elf) => (
                  <TableRow key={elf.id}>
                    <TableCell className="font-medium">{elf.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{elf.element}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{elf.rarity}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{elf.totalStats}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="mr-2">编辑</Button>
                      <Button variant="destructive" size="sm">删除</Button>
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
