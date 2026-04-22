import Link from "next/link"

import { createElf } from "@/app/actions/elves"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ELEMENT_NAMES, readCategoriesData } from "@/lib/game-data"

const ELEMENT_OPTIONS = [...ELEMENT_NAMES]

export default async function NewElfPage() {
  const categories = (await readCategoriesData()).filter((category) => category.target === "elf")

  return (
    <div className="flex max-w-4xl flex-col gap-4 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">新增图鉴精灵</h1>
          <p className="mt-1 text-muted-foreground">
            支持单属性和多属性精灵，勾选多个属性后会同步到小程序图鉴展示。
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
            建议填写一张主图，并按顺序补充其他展示图；多属性精灵可同时勾选多个属性。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createElf} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">名称</Label>
                <Input id="name" name="name" required placeholder="例如：迷你乌极夜的样子" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group">组别</Label>
                <Input id="group" name="group" placeholder="例如：迪莫家族 / 新手御三家" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <select
                  id="category"
                  name="category"
                  defaultValue=""
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">未分类</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">身高</Label>
                <Input id="height" name="height" placeholder="例如：0.65~0.92M" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">体重</Label>
                <Input id="weight" name="weight" placeholder="例如：14.2~15.6KG" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="raceValue">种族值（字符串）</Label>
                <Input id="raceValue" name="raceValue" placeholder="例如：460 / 430~520" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eggImageUrl">精灵蛋图片 URL</Label>
                <Input id="eggImageUrl" name="eggImageUrl" placeholder="https://roco.cdn.itianci.cn/imgs/eggs/demo.webp" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fruitImageUrl">精灵果实图片 URL</Label>
                <Input id="fruitImageUrl" name="fruitImageUrl" placeholder="https://roco.cdn.itianci.cn/imgs/eggs/demo-fruit.webp" />
              </div>
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
            </div>

            <div className="space-y-3">
              <Label>属性（可多选）</Label>
              <div className="grid grid-cols-4 gap-3 rounded-lg border p-4">
                {ELEMENT_OPTIONS.map((element) => (
                  <label key={element} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="elements"
                      value={element}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span>{element}系</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 rounded-md border p-4">
              <Checkbox id="isHot" name="isHot" />
              <div className="space-y-1 leading-none">
                <Label htmlFor="isHot" className="font-medium">
                  标记为热门精灵（备用）
                </Label>
                <p className="text-sm text-muted-foreground">
                  首页热门默认按详情查询次数自动排行，勾选仅用于后台手工兜底标记。
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coverImage">主图 URL</Label>
                <Input
                  id="coverImage"
                  name="coverImage"
                  placeholder="https://roco.cdn.itianci.cn/elves/cover.png"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="galleryImages">图集 URL（每行一张）</Label>
                <Textarea
                  id="galleryImages"
                  name="galleryImages"
                  className="min-h-[120px]"
                  placeholder={[
                    "https://roco.cdn.itianci.cn/elves/stage-1.png",
                    "https://roco.cdn.itianci.cn/elves/stage-2.png",
                    "https://roco.cdn.itianci.cn/elves/stage-3.png",
                  ].join("\n")}
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium">基础种族值（数值计算）</h3>
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
