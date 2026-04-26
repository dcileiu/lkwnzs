import { createCategory, deleteCategory } from "@/app/actions/categories"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { readCategoriesData } from "@/lib/game-data"
import { prisma } from "@/lib/prisma"

async function readItemCategories() {
  try {
    const categories = await prisma.itemCategory.findMany({
      include: {
        _count: {
          select: {
            fields: true,
            items: true,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    })

    return {
      categories,
      error: null as string | null,
    }
  } catch (error) {
    return {
      categories: [],
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export default async function CategoriesPage() {
  const [categories, itemCategoryResult] = await Promise.all([
    readCategoriesData(),
    readItemCategories(),
  ])
  const elfCategories = categories.filter((category) => category.target === "elf")
  const itemCategories = itemCategoryResult.categories

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">分类管理</h1>
        <p className="mt-1 text-muted-foreground">统一管理精灵分类和道具分类，供各业务页面复用。</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>新增分类</CardTitle>
          <CardDescription>
            精灵分类写入种子分类文件；道具分类写入数据库，并用于驱动道具管理表单。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCategory} className="grid grid-cols-[1fr_160px_auto] gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">分类名称</Label>
              <Input id="name" name="name" required placeholder="例如：场景精灵 / 恢复药剂" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">适用对象</Label>
              <select
                id="target"
                name="target"
                defaultValue="elf"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="elf">精灵</option>
                <option value="item">道具</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">添加分类</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>精灵分类</CardTitle>
            <CardDescription>{elfCategories.length} 个分类</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {elfCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无精灵分类。</p>
            ) : (
              elfCategories.map((category) => (
                <form key={`${category.target}-${category.id}`} action={deleteCategory} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {category.id}</p>
                  </div>
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="target" value={category.target} />
                  <Button type="submit" variant="destructive" size="sm">删除</Button>
                </form>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>道具分类</CardTitle>
            <CardDescription>
              {itemCategoryResult.error
                ? "数据库道具分类表尚未就绪"
                : `${itemCategories.length} 个分类`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {itemCategoryResult.error ? (
              <pre className="overflow-auto rounded-lg border bg-muted p-3 text-xs text-muted-foreground">
                {itemCategoryResult.error}
              </pre>
            ) : itemCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无道具分类，请先导入 daoju.json 或新增分类。</p>
            ) : (
              itemCategories.map((category) => (
                <form key={`item-${category.id}`} action={deleteCategory} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">
                      {category.icon ? `${category.icon} ` : ""}
                      {category.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {category.id} · 道具 {category._count.items} 个 · 字段 {category._count.fields} 个
                    </p>
                  </div>
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="target" value="item" />
                  <Button type="submit" variant="destructive" size="sm">删除</Button>
                </form>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
