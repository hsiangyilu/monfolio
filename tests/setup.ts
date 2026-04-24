import { beforeEach, afterAll } from "vitest"
import { prisma } from "@/lib/db"

beforeEach(async () => {
  // clean tables in reverse dependency order
  await prisma.holding.deleteMany()
  await prisma.debt.deleteMany()
  await prisma.portfolioSnapshot.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
