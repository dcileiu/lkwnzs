import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ELEMENT_NAMES } from "@/lib/game-data"

export default function AttrsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">属性管理</h1>
        <p className="mt-1 text-muted-foreground">统一维护属性名称与图标资源，供精灵和道具引用。</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>属性清单</CardTitle>
          <CardDescription>当前共 {ELEMENT_NAMES.length} 个属性。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {ELEMENT_NAMES.map((element) => {
              const iconUrl = `https://roco.cdn.itianci.cn/imgs/属性/${element}.wepb`

              return (
                <div key={element} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="outline">{element}</Badge>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={iconUrl} alt={`${element}属性图标`} className="h-6 w-6 rounded" />
                  </div>
                  <p className="break-all text-xs text-muted-foreground">{iconUrl}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
