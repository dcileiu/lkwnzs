import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createElf } from "@/app/actions/elves"
import Link from "next/link"

export default function NewElfPage() {
  return (
    <div className="flex flex-col gap-4 p-4 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">新增图鉴精灵</h1>
          <p className="text-muted-foreground mt-1">
            Add a new Pet/Elf to the Pokedex.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/elves">返回列表</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>精灵属性与数值</CardTitle>
          <CardDescription>
            Enter the base attributes and stats for the new Elf.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createElf} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">精灵名称 (Name)</Label>
                <Input id="name" name="name" required placeholder="例如：迪莫" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="element">系别 (Element)</Label>
                <Select name="element" required defaultValue="光">
                  <SelectTrigger id="element">
                    <SelectValue placeholder="选择系别" />
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
                <Label htmlFor="rarity">稀有度 (Rarity)</Label>
                <Select name="rarity" required defaultValue="SSR">
                  <SelectTrigger id="rarity">
                    <SelectValue placeholder="稀有程度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UR">UR 传世</SelectItem>
                    <SelectItem value="SSR">SSR 传说</SelectItem>
                    <SelectItem value="SR">SR 史诗</SelectItem>
                    <SelectItem value="R">R 稀有</SelectItem>
                    <SelectItem value="普通">普通</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="isHot" name="isHot" />
                  <Label htmlFor="isHot" className="font-medium">标记为热门推荐精灵</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">基础种族值 (Base Stats)</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hp">精力 (HP)</Label>
                  <Input id="hp" name="hp" type="number" defaultValue="100" min="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attack">攻击 (Attack)</Label>
                  <Input id="attack" name="attack" type="number" defaultValue="100" min="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defense">防御 (Defense)</Label>
                  <Input id="defense" name="defense" type="number" defaultValue="100" min="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speed">速度 (Speed)</Label>
                  <Input id="speed" name="speed" type="number" defaultValue="100" min="0" />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full">
              添加精灵入册
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
