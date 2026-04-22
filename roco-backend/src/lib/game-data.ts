import { promises as fs } from "node:fs"
import path from "node:path"

const DATA_DIR = path.join(process.cwd(), "data")

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

export type ItemRecord = {
  id?: string | number
  no?: string
  name?: string
  type?: string
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
