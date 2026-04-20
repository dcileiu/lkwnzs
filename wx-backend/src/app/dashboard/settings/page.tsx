import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">系统设置</h1>
        <p className="mt-1 text-muted-foreground">
          管理后台的全局配置入口已经接通，具体设置项可以继续往这里扩展。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>设置中心</CardTitle>
          <CardDescription>当前页面为基础占位页，用于保证菜单切换正常。</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          后续可以在这里接入管理员账号、站点配置、通知规则等后台设置。
        </CardContent>
      </Card>
    </div>
  )
}
