export const SHOP_CURRENCY_OPTIONS = [
  { value: "rocoshell", label: "洛克贝" },
  { value: "gold", label: "金币" },
  { value: "diamond", label: "钻石" },
  { value: "event", label: "活动币" },
  { value: "other", label: "其他" },
] as const

export const SHOP_ROUND_SLOT_OPTIONS = [
  { value: "1", label: "第1轮（08:00-12:00）" },
  { value: "2", label: "第2轮（12:00-16:00）" },
  { value: "3", label: "第3轮（16:00-20:00）" },
  { value: "4", label: "第4轮（20:00-24:00）" },
] as const

export function getCurrencyLabel(value: string) {
  return SHOP_CURRENCY_OPTIONS.find((option) => option.value === value)?.label || value
}

export function getRoundSlotLabel(value: number | null | undefined) {
  if (!value) return "自定义时间"
  return SHOP_ROUND_SLOT_OPTIONS.find((option) => Number(option.value) === value)?.label || `第${value}轮`
}

export function formatDateTimeLocal(value: Date | null | undefined) {
  if (!value) return ""
  const offset = value.getTimezoneOffset()
  const local = new Date(value.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}
