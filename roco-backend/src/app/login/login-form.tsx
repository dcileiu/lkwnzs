"use client"

import { useActionState } from "react"
import { loginAction, type LoginActionState } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initialState: LoginActionState = {}

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <div className="space-y-2">
        <Label htmlFor="username">管理员账号</Label>
        <Input id="username" name="username" placeholder="请输入管理员账号" autoComplete="username" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">管理员密码</Label>
        <Input id="password" name="password" type="password" placeholder="请输入管理员密码" autoComplete="current-password" required />
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "登录中..." : "登录后台"}
      </Button>
    </form>
  )
}
