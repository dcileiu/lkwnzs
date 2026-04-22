import { promises as fs } from "node:fs"
import path from "node:path"

const DATA_DIR = path.join(process.cwd(), "data")
const CATEGORIES_FILE = "categories.json"

export const ELEMENT_NAMES = [
  "光",
  "冰",
  "地",
  "幻",
  "幽",
  "恶",
  "普通",
  "机械",
  "武",
  "毒",
  "水",
  "火",
  "电",
  "翼",
  "草",
  "萌",
  "虫",
  "龙",
] as const

export type CategoryTarget = "elf" | "item"

export type CategoryRecord = {
  id: string
  name: string
  target: CategoryTarget
}

export type ItemRecord = {
  id?: string | number
  no?: string
  name?: string
  type?: string
  category?: string
  quality?: string
  icon?: string
  image?: string
  [key: string]: unknown
}

async function readJsonFile<T>(filename: string): Promise<T | null> {
  const fullPath = path.join(DATA_DIR, filename)

  try {
    const content = await fs.readFile(fullPath, "utf8")
    return JSON.parse(content) as T
  } catch {
    return null
  }
}

export async function writeCategoriesData(categories: CategoryRecord[]) {
  const fullPath = path.join(DATA_DIR, CATEGORIES_FILE)
  await fs.writeFile(fullPath, `${JSON.stringify(categories, null, 2)}\n`, "utf8")
}

export async function readCategoriesData() {
  const categories = await readJsonFile<CategoryRecord[]>(CATEGORIES_FILE)

  if (!Array.isArray(categories)) return []

  return categories
    .filter((item) => item && typeof item.id === "string" && typeof item.name === "string" && (item.target === "elf" || item.target === "item"))
    .map((item) => ({
      id: item.id,
      name: item.name,
      target: item.target,
    }))
}

export async function readElvesData() {
  const elves = await readJsonFile<unknown[]>("jingling.json")
  return Array.isArray(elves) ? elves : []
}

export async function readItemsData() {
  const itemCandidates = ["daoju.json", "道具.json", "items.json"]

  for (const filename of itemCandidates) {
    const data = await readJsonFile<unknown>(filename)

    if (Array.isArray(data)) {
      return { filename, items: data as ItemRecord[] }
    }

    if (data && typeof data === "object" && Array.isArray((data as { items?: unknown[] }).items)) {
      return {
        filename,
        items: (data as { items: ItemRecord[] }).items,
      }
    }
  }

  return {
    filename: null,
    items: [] as ItemRecord[],
  }
}
