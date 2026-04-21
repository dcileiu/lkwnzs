import Link from "next/link"
import { createEgg } from "@/app/actions/eggs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function NewEggPage() {
  return (
    <div className="flex max-w-4xl flex-col gap-4 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">新增宠物蛋</h1>
          <p className="mt-1 text-muted-foreground">
            Create a new egg cover image and gallery entry for the mini program.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/eggs">返回列表</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>蛋集资料</CardTitle>
          <CardDescription>
            建议把蛋图放在图集第一张，幼年精灵图放第二张，后续补细节图也可以继续往下加。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createEgg} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input id="name" name="name" required placeholder="例如：波罗冬之蛋" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">主图 URL</Label>
              <Input
                id="coverImage"
                name="coverImage"
                placeholder="https://cdn.example.com/eggs/cover.png"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="galleryImages">图集 URL（每行一张）</Label>
              <Textarea
                id="galleryImages"
                name="galleryImages"
                className="min-h-[140px]"
                placeholder={[
                  "https://cdn.example.com/eggs/egg-cover.png",
                  "https://cdn.example.com/eggs/baby-preview.png",
                  "https://cdn.example.com/eggs/detail-shot.png",
                ].join("\n")}
              />
            </div>

            <Button type="submit" className="w-full">
              添加宠物蛋
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
