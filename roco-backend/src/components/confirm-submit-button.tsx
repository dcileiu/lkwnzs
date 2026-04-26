"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type BaseButtonProps = React.ComponentProps<typeof Button>

interface ConfirmSubmitButtonProps extends Omit<BaseButtonProps, "onClick" | "type"> {
  confirmTitle?: string
  confirmMessage?: string
  children?: React.ReactNode
  type?: "button" | "submit" | "reset"
}

export function ConfirmSubmitButton({
  confirmTitle = "确认操作",
  confirmMessage = "确认要执行该删除操作吗？",
  ...props
}: ConfirmSubmitButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const [open, setOpen] = React.useState(false)

  const handleOpen = React.useCallback<React.MouseEventHandler<HTMLButtonElement>>(
    (event) => {
      event.preventDefault()
      setOpen(true)
    },
    [],
  )

  const handleConfirm = React.useCallback(() => {
    const form = buttonRef.current?.closest("form")
    if (form) {
      form.requestSubmit()
    }
    setOpen(false)
  }, [])

  return (
    <>
      <Button {...props} ref={buttonRef} type="button" onClick={handleOpen} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{confirmTitle}</DialogTitle>
            <DialogDescription>{confirmMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirm}>
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
