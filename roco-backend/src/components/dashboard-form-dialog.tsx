"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export type DashboardFormDialogProps = {
  triggerRender: React.ReactElement
  triggerChildren: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  contentClassName?: string
  formClassName?: string
  action: (formData: FormData) => Promise<void>
  /** 每次打开弹窗时重置表单（适用于新增类弹窗） */
  resetFormOnOpen?: boolean
  children: React.ReactNode
}

export function DashboardFormDialog({
  triggerRender,
  triggerChildren,
  title,
  description,
  contentClassName,
  formClassName,
  action,
  resetFormOnOpen = false,
  children,
}: DashboardFormDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [formKey, setFormKey] = React.useState(0)

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      setOpen(next)
      if (next && resetFormOnOpen) {
        setFormKey((k) => k + 1)
      }
    },
    [resetFormOnOpen],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={triggerRender}>{triggerChildren}</DialogTrigger>
      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form
          key={resetFormOnOpen ? formKey : undefined}
          className={formClassName}
          action={async (formData) => {
            await action(formData)
            setOpen(false)
          }}
        >
          {children}
        </form>
      </DialogContent>
    </Dialog>
  )
}
