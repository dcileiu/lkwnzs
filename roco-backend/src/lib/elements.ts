const ELEMENT_SEPARATORS = /[\/,，、|]/g

export function normalizeElementList(input: string | string[] | null | undefined) {
  const rawValues = Array.isArray(input) ? input : [input ?? ""]

  const normalized = rawValues
    .flatMap((value) => String(value).split(ELEMENT_SEPARATORS))
    .map((value) => value.trim())
    .filter(Boolean)

  return Array.from(new Set(normalized))
}

export function serializeElementList(input: string | string[] | null | undefined) {
  return normalizeElementList(input).join(" / ")
}

export function matchesElement(serializedElements: string, targetElement: string) {
  return normalizeElementList(serializedElements).includes(targetElement.trim())
}
