type ImageRecord = {
  url: string
  altText?: string
  sortOrder: number
}

export type StoredImageRecord = {
  id: string
  url: string
  altText?: string | null
  sortOrder: number
  createdAt?: Date
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export function parseImageRecords(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [] as ImageRecord[]
  }

  return splitLines(value).map((url, index) => ({
    url,
    sortOrder: index,
  }))
}

export function resolveCoverImage(
  coverImage: FormDataEntryValue | null,
  imageRecords: ImageRecord[]
) {
  if (typeof coverImage === "string" && coverImage.trim()) {
    return coverImage.trim()
  }

  return imageRecords[0]?.url ?? null
}

export function sortImageRecords<
  T extends { sortOrder: number; createdAt?: Date; url: string; altText?: string | null }
>(images: T[]): T[] {
  const sorted = [...images] as T[]

  return sorted.sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder
    }

    if (left.createdAt && right.createdAt) {
      return left.createdAt.getTime() - right.createdAt.getTime()
    }

    return left.url.localeCompare(right.url)
  })
}
