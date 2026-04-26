import Link from "next/link"
import { notFound } from "next/navigation"

import { updateItem } from "@/app/actions/items"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { prisma } from "@/lib/prisma"

interface EditItemPageProps {
  params: Promise<{ id: string }>
}

export default async function EditItemPage({ params }: EditItemPageProps) {
  const { id } = await params
  const [item, categories] = await Promise.all([
    prisma.item.findUnique({
      where: { id },
      include: { category: true },
    }),
    prisma.itemCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ])

  if (!item) {
    notFound()
  }

  return (
    <div className="flex max-w-4xl flex-col gap-4 p-4 lg:p-8">
      <div className="sticky top-0 z-20 -mx-4 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">编辑道具</h1>
          <p className="mt-1 text-muted-foreground">更新道具基础信息，保存后立即生效。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/items">返回列表</Link>
          </Button>
          <Button type="submit" form="item-edit-form">
            保存修改
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>道具信息</CardTitle>
          <CardDescription>可修改名称、分类、展示信息、效果与获取方式。</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="item-edit-form" action={updateItem} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="redirectTo" value="/dashboard/items" />

            <div className="space-y-2">
              <Label htmlFor="edit-item-category">分类</Label>
              <select
                id="edit-item-category"
                name="categoryId"
                required
                defaultValue={item.categoryId}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-item-name">道具名称</Label>
              <Input id="edit-item-name" name="name" required defaultValue={item.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-item-rarity">品质</Label>
              <Input id="edit-item-rarity" name="rarity" defaultValue={item.rarity ?? ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-item-image">图片路径</Label>
              <Input id="edit-item-image" name="image" defaultValue={item.image ?? ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-item-attr">属性</Label>
              <Input id="edit-item-attr" name="attr" defaultValue={item.attr ?? ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-item-sort">排序</Label>
              <Input id="edit-item-sort" name="sortOrder" type="number" defaultValue={item.sortOrder} />
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="edit-item-effect">效果</Label>
              <Textarea id="edit-item-effect" name="effect" rows={3} defaultValue={item.effect ?? ""} />
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="edit-item-obtain">获取方式</Label>
              <Textarea id="edit-item-obtain" name="obtain" rows={3} defaultValue={item.obtain ?? ""} />
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <Label htmlFor="edit-item-desc">描述</Label>
              <Textarea id="edit-item-desc" name="desc" rows={3} defaultValue={item.desc ?? ""} />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
