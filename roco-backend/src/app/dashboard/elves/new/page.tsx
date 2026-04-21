import Link from "next/link"
import { createElf } from "@/app/actions/elves"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function NewElfPage() {
  return (
    <div className="flex max-w-4xl flex-col gap-4 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">新增图鉴精灵</h1>
          <p className="mt-1 text-muted-foreground">
            Create a new elf with a cover image and optional gallery.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/elves">返回列表</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>精灵资料</CardTitle>
          <CardDescription>
            建议填写一张主图，再把幼年图、进化图、立绘图按顺序放进图集。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createElf} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">名称</Label>
                <Input id="name" name="name" required placeholder="例如：迪莫" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="element">属性</Label>
                <Select name="element" required defaultValue="光">
                  <SelectTrigger id="element">
                    <SelectValue placeholder="选择属性" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="火">火系</SelectItem>
                    <SelectItem value="水">水系</SelectItem>
                    <SelectItem value="草">草系</SelectItem>
                    <SelectItem value="光">光系</SelectItem>
                    <SelectItem value="暗">暗系</SelectItem>
                    <SelectItem value="电">电系</SelectItem>
                    <SelectItem value="冰">冰系</SelectItem>
                    <SelectItem value="普通">普通系</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rarity">稀有度</Label>
                <Select name="rarity" required defaultValue="SSR">
                  <SelectTrigger id="rarity">
                    <SelectValue placeholder="选择稀有度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UR">UR</SelectItem>
                    <SelectItem value="SSR">SSR</SelectItem>
                    <SelectItem value="SR">SR</SelectItem>
                    <SelectItem value="R">R</SelectItem>
                    <SelectItem value="普通">普通</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="isHot" name="isHot" />
                  <Label htmlFor="isHot" className="font-medium">
                    标记为热门精灵
                  </Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coverImage">主图 URL</Label>
                <Input
                  id="coverImage"
                  name="coverImage"
                  placeholder="https://cdn.example.com/elves/cover.png"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="galleryImages">图集 URL（每行一张）</Label>
                <Textarea
                  id="galleryImages"
                  name="galleryImages"
                  className="min-h-[120px]"
                  placeholder={[
                    "https://cdn.example.com/elves/stage-1.png",
                    "https://cdn.example.com/elves/stage-2.png",
                    "https://cdn.example.com/elves/stage-3.png",
                  ].join("\n")}
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium">基础种族值</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hp">HP</Label>
                  <Input id="hp" name="hp" type="number" defaultValue="100" min="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attack">攻击</Label>
                  <Input id="attack" name="attack" type="number" defaultValue="100" min="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defense">防御</Label>
                  <Input id="defense" name="defense" type="number" defaultValue="100" min="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speed">速度</Label>
                  <Input id="speed" name="speed" type="number" defaultValue="100" min="0" />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full">
              添加精灵
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
