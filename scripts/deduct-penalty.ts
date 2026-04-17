import { config } from "dotenv"
import { resolve } from "path"
config({ path: resolve(process.cwd(), ".env") })

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const TARGETS = ["Avyaan Jain", "Vivaan Mehra", "Prabal Gupta"]
const DEDUCTION = 30_000
const WARNING =
  "⚠️ Penalty Notice: 30,000 coins have been deducted from your account for exploiting a coin loophole. This is a formal warning — any further violations may result in a permanent account ban."

async function main() {
  for (const name of TARGETS) {
    const user = await prisma.user.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true, name: true, coins: true },
    })

    if (!user) {
      console.warn(`❌ User not found: ${name}`)
      continue
    }

    const newCoins = Math.max(0, user.coins - DEDUCTION)
    const actualDeducted = user.coins - newCoins

    await prisma.user.update({
      where: { id: user.id },
      data: { coins: newCoins },
    })

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "admin_message",
        message: WARNING,
      },
    })

    console.log(
      `✅ ${user.name} — coins: ${user.coins} → ${newCoins} (deducted ${actualDeducted})`
    )
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
