import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SearchPage() {
  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">系统搜索</h1>
        <p className="mt-1 text-muted-foreground">
          后台搜索入口已经接通，后续可以在这里统一检索文章、精灵、宠物蛋和用户。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>搜索中心</CardTitle>
          <CardDescription>当前页面为基础占位页，用于保证菜单切换正常。</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          如果你要，我下一步可以直接把全局搜索做成按关键词检索内容的后台页。
        </CardContent>
      </Card>
    </div>
  )
}
