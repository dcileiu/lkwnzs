import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusIcon } from "lucide-react"

export default async function EggsPage() {
  const eggs = await prisma.egg.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { rules: true }
      }
    }
  })

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">宠物蛋集 (Eggs & Hatch Rules)</h1>
          <p className="text-muted-foreground mt-1">
            Manage Pet Eggs and their hatching probability rules.
          </p>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          新增宠物蛋
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>所有宠物蛋</CardTitle>
          <CardDescription>
            {eggs.length} 种宠物蛋在册
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称 (Name)</TableHead>
                <TableHead className="text-right">孵化规则数 (Rules Count)</TableHead>
                <TableHead>操作 (Actions)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eggs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    暂无宠物蛋，请点击右上角新增
                  </TableCell>
                </TableRow>
              ) : (
                eggs.map((egg) => (
                  <TableRow key={egg.id}>
                    <TableCell className="font-medium">{egg.name}</TableCell>
                    <TableCell className="text-right">{egg._count.rules}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="mr-2">管理孵化规则</Button>
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
