"use client"

import { updateElf } from "@/app/actions/elves"
import { DashboardFormDialog } from "@/components/dashboard-form-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type ElfEditDialogProps = {
  elf: {
    id: string
    name: string
    element: string
    rarity: string
    group: string | null
    category: string | null
    height: string | null
    weight: string | null
    raceValue: string | null
    eggImageUrl: string | null
    fruitImageUrl: string | null
    avatar: string | null
    isHot: boolean
    hp: number
    attack: number
    defense: number
    speed: number
    images: Array<{ url: string }>
  }
  elementOptions: string[]
  categoryOptions: string[]
  redirectTo: string
}

function splitElements(value: string) {
  return value
    .split(/[\/,，、|]/g)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function ElfEditDialog({
  elf,
  elementOptions,
  categoryOptions,
  redirectTo,
}: ElfEditDialogProps) {
  const selectedElements = new Set(splitElements(elf.element))
  const galleryImages = elf.images.map((image) => image.url).join("\n")

  return (
    <DashboardFormDialog
      triggerRender={<Button type="button" variant="outline" size="sm" className="mr-2" />}
      triggerChildren="编辑"
      title="编辑精灵"
      description={`当前编辑：${elf.name}`}
      contentClassName="max-h-[90vh] max-w-4xl overflow-y-auto sm:max-w-4xl"
      formClassName="space-y-4"
      action={updateElf}
    >
          <input type="hidden" name="id" value={elf.id} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`name-${elf.id}`}>名称</Label>
              <Input id={`name-${elf.id}`} name="name" required defaultValue={elf.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`group-${elf.id}`}>组别</Label>
              <Input id={`group-${elf.id}`} name="group" defaultValue={elf.group ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`category-${elf.id}`}>分类</Label>
              <select
                id={`category-${elf.id}`}
                name="category"
                defaultValue={elf.category ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">未分类</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`rarity-${elf.id}`}>稀有度</Label>
              <select
                id={`rarity-${elf.id}`}
                name="rarity"
                required
                defaultValue={elf.rarity}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="UR">UR</option>
                <option value="SSR">SSR</option>
                <option value="SR">SR</option>
                <option value="R">R</option>
                <option value="普通">普通</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`height-${elf.id}`}>身高</Label>
              <Input id={`height-${elf.id}`} name="height" defaultValue={elf.height ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`weight-${elf.id}`}>体重</Label>
              <Input id={`weight-${elf.id}`} name="weight" defaultValue={elf.weight ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`raceValue-${elf.id}`}>种族值（字符串）</Label>
              <Input id={`raceValue-${elf.id}`} name="raceValue" defaultValue={elf.raceValue ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`coverImage-${elf.id}`}>主图 URL</Label>
              <Input id={`coverImage-${elf.id}`} name="coverImage" defaultValue={elf.avatar ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`eggImageUrl-${elf.id}`}>精灵蛋图 URL</Label>
              <Input id={`eggImageUrl-${elf.id}`} name="eggImageUrl" defaultValue={elf.eggImageUrl ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`fruitImageUrl-${elf.id}`}>果实图 URL</Label>
              <Input id={`fruitImageUrl-${elf.id}`} name="fruitImageUrl" defaultValue={elf.fruitImageUrl ?? ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>属性（可多选）</Label>
            <div className="grid grid-cols-4 gap-2 rounded-md border p-3">
              {elementOptions.map((element) => (
                <label key={element} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="elements"
                    value={element}
                    defaultChecked={selectedElements.has(element)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span>{element}系</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isHot" defaultChecked={elf.isHot} className="h-4 w-4 rounded border-input" />
            <span>标记为热门精灵</span>
          </label>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`hp-${elf.id}`}>HP</Label>
              <Input id={`hp-${elf.id}`} name="hp" type="number" defaultValue={elf.hp} min={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`attack-${elf.id}`}>攻击</Label>
              <Input id={`attack-${elf.id}`} name="attack" type="number" defaultValue={elf.attack} min={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`defense-${elf.id}`}>防御</Label>
              <Input id={`defense-${elf.id}`} name="defense" type="number" defaultValue={elf.defense} min={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`speed-${elf.id}`}>速度</Label>
              <Input id={`speed-${elf.id}`} name="speed" type="number" defaultValue={elf.speed} min={0} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`galleryImages-${elf.id}`}>图集 URL（每行一张）</Label>
            <Textarea
              id={`galleryImages-${elf.id}`}
              name="galleryImages"
              className="min-h-[120px]"
              defaultValue={galleryImages}
            />
          </div>

          <Button type="submit" className="w-full">
            保存修改
          </Button>
    </DashboardFormDialog>
  )
}
