import fs from "node:fs/promises"
import path from "node:path"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

dotenv.config({ path: path.join(process.cwd(), ".env") })
dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true })

const prisma = new PrismaClient()
const JINGLING_FILE = path.join(process.cwd(), "data", "jingling.json")

const EGG_GROUPS = [
  {
    id: "sky",
    name: "天空组",
    names: "鸭吉吉、溯源钟、多灵主、高脚鹬、皇家狮鹫、泥吼牙、魔眷鸟、厉毒修萝、武者鸡、粉星仔、岗鸟、翼龙、咔咔乌、绅士鸡、公平鸽、星云旅者、噼啪鸟、帕帕斯卡、彩蝶鲨、花魁蜂后、火羽、翠顶夫人、黑羽夫人、斑枭、锤头鹳、卷毛鸭",
  },
  {
    id: "amphibian",
    name: "两栖组",
    names: "水泡壳、石冠王蜥、鳗尾兽、嗜波螺、翠顶夫人、寒音蛇、深蓝鲸、海豹船长、卷胡巨懒、卡瓦重、黑羽夫人",
  },
  {
    id: "plant",
    name: "植物组",
    names: "奇丽花、幽影树、蹦蹦花、伊贝粉粉、燃薪虫、怖哭菇、兽花蕾、幻影灵菇、海枝枝、格兰球、菊花梨、蒲公英娃娃、九幽菇",
  },
  {
    id: "monster",
    name: "怪兽组",
    names: "波多西、烈火守护、罗隐、巨噬针鼹、雪巨人、深蓝鲸、火焰猿、梦想三三、圣剑 - X、邪眼巨魔、火神、古啦多、布克棱岩、寂灭骨龙、乌拉塔、夜枭",
  },
  {
    id: "fairy-elf",
    name: "精灵组",
    names: "水灵、幽冥眼、果冻、幻影灵菇、荆棘电环、火神、梦悠悠、圣代甜甜、夜枭",
  },
  {
    id: "humanoid",
    name: "拟人组",
    names: "格斗小五、怒目怂猫、多灵主、绅士鸡、武者鸡、厉毒修萝、火焰猿、魔草巫灵、瞌睡王、帅帅魔偶、格斗小六、雪巨人暮星辰、朔夜伊芙、九幽菇、影狸、白发路路、健猫教练",
  },
  {
    id: "animal",
    name: "动物组",
    names: "恶魔狼、巨噬针鼹、爵士鹿、白发路路、遁地鼠、春花兔、壳栗丝鼠、尖嘴狐仙、月牙雪熊、音速犬、獠牙猪、针叶巡林、裘卡、花影羚羊、皇家狮鹫、寒音蛇、火焰猿、魔力猫、蹦床松鼠、炽心勇狮、电咩咩、白金独角兽、星光狮、黑猫巫师",
  },
  {
    id: "insect",
    name: "昆虫组",
    names: "花衣蝶、芋香巨角蛛、花魁蜂后、风滚暮虫、燃薪虫、邪眼巨魔、窃光蚊、食尘短绒、化蝶、铠甲虫、陨星虫、捕尘长绒",
  },
  {
    id: "dragon",
    name: "巨龙组",
    names: "翼龙、伊兰亚龙、龙鱼、寂灭骨龙",
  },
  {
    id: "ocean",
    name: "海洋组",
    names: "闪电鳗鱼、月亮砣、龙鱼、琉璃水母、果冻、深蓝鲸、彩蝶鲨、圆号鱼、海枝枝、千棘盔、利灯鱼、里拉鳐",
  },
  {
    id: "machine",
    name: "机械组",
    names: "波多西、溯源钟、机甲小子、权杖、迷迷箱怪、声波缇塔、圣剑 - X、贝瑟、立方人、帕帕斯卡",
  },
  {
    id: "mineral",
    name: "矿石组",
    names: "罗隐、石冠王蜥、晶石蜗、巨灵石、布克棱岩、记忆石、嗜波螺、仪式巨像",
  },
  {
    id: "sprite",
    name: "妖精组",
    names: "春花兔、朔夜伊芙、格兰球、梦悠悠、梦想三三、棋棋、画精灵、书魔虫、里拉鳐、酷拉、红绒十字、裘卡、卡洛儿、兽花蕾、叮叮恶魔、雪影娃娃、雪灵、花衣蝶、暮星辰、黑猫巫师、粉星仔、幽影树、小皮球、号儿鱼、卡拉波斯、嘟嘟锅",
  },
  {
    id: "good",
    name: "乖乖组",
    names: "圣代甜甜、魔眷鸟、小皮球、卡洛儿、暮星辰、化蝶",
  },
]

function stripBom(content) {
  return content.replace(/^\uFEFF/, "")
}

function splitNames(value) {
  return value
    .split(/[、,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeName(value) {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .replace(/[－–—]/g, "-")
    .replace(/[（）()]/g, "")
    .toLowerCase()
}

function pickElfFields(name, elf) {
  return {
    name: elf?.name || name,
    image: typeof elf?.image === "string" ? elf.image : null,
    attributes: JSON.stringify(Array.isArray(elf?.attributes) ? elf.attributes : []),
    attrNames: JSON.stringify(Array.isArray(elf?.attrNames) ? elf.attrNames : []),
  }
}

async function readElves() {
  const content = await fs.readFile(JINGLING_FILE, "utf8")
  const parsed = JSON.parse(stripBom(content))
  if (!Array.isArray(parsed)) {
    throw new Error("data/jingling.json 必须是数组。")
  }
  return parsed
}

function buildElfMatcher(elves) {
  const exact = new Map()
  const normalized = new Map()

  for (const elf of elves) {
    if (!elf || typeof elf.name !== "string") continue
    if (!exact.has(elf.name)) exact.set(elf.name, elf)
    const key = normalizeName(elf.name)
    if (!normalized.has(key)) normalized.set(key, elf)
  }

  return (name) => {
    const key = normalizeName(name)
    return (
      exact.get(name) ||
      normalized.get(key) ||
      elves.find((elf) => typeof elf?.name === "string" && normalizeName(elf.name).startsWith(key))
    )
  }
}

async function main() {
  const elves = await readElves()
  const matchElf = buildElfMatcher(elves)
  const unmatched = []
  let linkedCount = 0

  for (const [groupIndex, group] of EGG_GROUPS.entries()) {
    await prisma.eggGroup.upsert({
      where: { id: group.id },
      update: {
        name: group.name,
        description: "洛克王国世界宠物蛋组对照",
        sortOrder: groupIndex,
      },
      create: {
        id: group.id,
        name: group.name,
        description: "洛克王国世界宠物蛋组对照",
        sortOrder: groupIndex,
      },
    })

    await prisma.eggGroupElf.deleteMany({
      where: { groupId: group.id },
    })

    for (const [elfIndex, name] of splitNames(group.names).entries()) {
      const elf = matchElf(name)
      if (!elf) unmatched.push(`${group.name}/${name}`)
      const data = pickElfFields(name, elf)

      await prisma.eggGroupElf.create({
        data: {
          groupId: group.id,
          sortOrder: elfIndex,
          ...data,
        },
      })
      linkedCount += 1
    }
  }

  console.log(`已导入 ${EGG_GROUPS.length} 个蛋组，${linkedCount} 条蛋组精灵。`)
  if (unmatched.length) {
    console.warn(`未在 jingling.json 精确匹配到 ${unmatched.length} 个名称：`)
    console.warn(unmatched.join("、"))
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
