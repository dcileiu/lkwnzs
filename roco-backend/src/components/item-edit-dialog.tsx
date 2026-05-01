"use client"

import { updateItem } from "@/app/actions/items"
import { DashboardFormDialog } from "@/components/dashboard-form-dialog"
import { SearchableSelect } from "@/components/searchable-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type ItemEditDialogProps = {
  item: {
    id: string
    categoryId: string
    name: string
    rarity: string | null
    image: string | null
    attr: string | null
    sortOrder: number
    effect: string | null
    obtain: string | null
    desc: string | null
  }
  categories: Array<{ id: string; name: string }>
}

export function ItemEditDialog({ item, categories }: ItemEditDialogProps) {
  return (
    <DashboardFormDialog
      triggerRender={<Button type="button" variant="outline" size="sm" />}
      triggerChildren="编辑"
      title="编辑道具"
      description={`当前编辑：${item.name}`}
      contentClassName="max-h-[90vh] max-w-4xl overflow-y-auto sm:max-w-4xl"
      formClassName="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      action={updateItem}
    >
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="redirectTo" value="/dashboard/items" />

          <div className="space-y-2">
            <Label>分类</Label>
            <SearchableSelect
              name="categoryId"
              defaultValue={item.categoryId}
              options={categories.map((category) => ({ value: category.id, label: category.name }))}
              placeholder="选择分类（支持搜索）"
              noOptionsText="没有匹配的分类"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-item-name-${item.id}`}>道具名称</Label>
            <Input id={`edit-item-name-${item.id}`} name="name" required defaultValue={item.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-item-rarity-${item.id}`}>品质</Label>
            <Input id={`edit-item-rarity-${item.id}`} name="rarity" defaultValue={item.rarity ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-item-image-${item.id}`}>图片路径</Label>
            <Input id={`edit-item-image-${item.id}`} name="image" defaultValue={item.image ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-item-attr-${item.id}`}>属性</Label>
            <Input id={`edit-item-attr-${item.id}`} name="attr" defaultValue={item.attr ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-item-sort-${item.id}`}>排序</Label>
            <Input id={`edit-item-sort-${item.id}`} name="sortOrder" type="number" defaultValue={item.sortOrder} />
          </div>

          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label htmlFor={`edit-item-effect-${item.id}`}>效果</Label>
            <Textarea id={`edit-item-effect-${item.id}`} name="effect" rows={3} defaultValue={item.effect ?? ""} />
          </div>

          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label htmlFor={`edit-item-obtain-${item.id}`}>获取方式</Label>
            <Textarea id={`edit-item-obtain-${item.id}`} name="obtain" rows={3} defaultValue={item.obtain ?? ""} />
          </div>

          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label htmlFor={`edit-item-desc-${item.id}`}>描述</Label>
            <Textarea id={`edit-item-desc-${item.id}`} name="desc" rows={3} defaultValue={item.desc ?? ""} />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Button type="submit" className="w-full">
              保存修改
            </Button>
          </div>
    </DashboardFormDialog>
  )
}
