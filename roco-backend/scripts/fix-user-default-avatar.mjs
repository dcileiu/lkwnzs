import path from "node:path"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

dotenv.config({ path: path.join(process.cwd(), ".env") })
dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true })

const prisma = new PrismaClient()

const DEFAULT_AVATAR = "/imgs/avatar/default-avatar.webp"

async function main() {
  const userCount = await prisma.user.count()

  if (userCount === 0) {
    console.log("没有用户数据，跳过修复。")
    return
  }

  const result = await prisma.user.updateMany({
    data: {
      avatar: DEFAULT_AVATAR,
    },
  })

  console.log("用户头像修复完成：")
  console.log(`- 总用户数: ${userCount}`)
  console.log(`- 更新数量: ${result.count}`)
  console.log(`- 默认头像: ${DEFAULT_AVATAR}`)
}

main()
  .catch((error) => {
    console.error("修复失败：", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
