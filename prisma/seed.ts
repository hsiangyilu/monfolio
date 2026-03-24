import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed Taiwan stocks
  const twStocks = [
    { symbol: "006208", name: "富邦台50", quantity: 3133, costBasis: null },
    { symbol: "2327", name: "國巨", quantity: 430, costBasis: null },
    { symbol: "2330", name: "台積電", quantity: 37, costBasis: null },
    { symbol: "0056", name: "元大高股息", quantity: 1270, costBasis: null },
    { symbol: "2886", name: "兆豐金", quantity: 3000, costBasis: null },
    { symbol: "0052", name: "富邦科技", quantity: 1300, costBasis: null },
  ];

  for (const stock of twStocks) {
    await prisma.holding.upsert({
      where: { category_symbol: { category: "tw_stock", symbol: stock.symbol } },
      update: { quantity: stock.quantity },
      create: {
        category: "tw_stock",
        symbol: stock.symbol,
        name: stock.name,
        quantity: stock.quantity,
        costBasis: stock.costBasis,
        costCurrency: "TWD",
      },
    });
  }

  // Seed US stocks
  const usStocks = [
    { symbol: "ADBE", name: "Adobe", quantity: 4, costBasis: null },
    { symbol: "ADSK", name: "Autodesk", quantity: 2, costBasis: null },
    { symbol: "FIG", name: "Freedom", quantity: 5, costBasis: null },
    { symbol: "PYPL", name: "PayPal", quantity: 2, costBasis: null },
    { symbol: "TSLA", name: "Tesla", quantity: 6, costBasis: null },
    { symbol: "VOO", name: "S&P 500 ETF", quantity: 16.46, costBasis: null },
  ];

  for (const stock of usStocks) {
    await prisma.holding.upsert({
      where: { category_symbol: { category: "us_stock", symbol: stock.symbol } },
      update: { quantity: stock.quantity },
      create: {
        category: "us_stock",
        symbol: stock.symbol,
        name: stock.name,
        quantity: stock.quantity,
        costBasis: stock.costBasis,
        costCurrency: "USD",
      },
    });
  }

  // Seed crypto
  const cryptos = [
    { symbol: "USDT", name: "USDT", quantity: 787.12, costBasis: null },
    { symbol: "BTC", name: "比特幣", quantity: 0.0084, costBasis: null },
    { symbol: "SOL", name: "索羅納", quantity: 2.505, costBasis: null },
    { symbol: "CRV", name: "CRV", quantity: 52.75, costBasis: null },
  ];

  for (const crypto of cryptos) {
    await prisma.holding.upsert({
      where: { category_symbol: { category: "crypto", symbol: crypto.symbol } },
      update: { quantity: crypto.quantity },
      create: {
        category: "crypto",
        symbol: crypto.symbol,
        name: crypto.name,
        quantity: crypto.quantity,
        costBasis: crypto.costBasis,
        costCurrency: "USD",
      },
    });
  }

  // Seed cash
  await prisma.holding.upsert({
    where: { category_symbol: { category: "cash", symbol: "TWD" } },
    update: { quantity: 100000 },
    create: {
      category: "cash",
      symbol: "TWD",
      name: "台幣現金",
      quantity: 100000,
      costCurrency: "TWD",
    },
  });

  // Seed debt
  const existingDebt = await prisma.debt.findFirst();
  if (!existingDebt) {
    await prisma.debt.create({
      data: {
        name: "信貸",
        principalTotal: 300000,
        remainingBalance: 275822,
        interestRate: 0.035,
        remainingTerms: 48,
        monthlyPayment: 6700,
      },
    });
  }

  // Seed target allocations
  const allocations = [
    { category: "tw_stock", targetPct: 40 },
    { category: "us_stock", targetPct: 35 },
    { category: "crypto", targetPct: 15 },
    { category: "cash", targetPct: 10 },
  ];

  for (const alloc of allocations) {
    await prisma.targetAllocation.upsert({
      where: { category: alloc.category },
      update: { targetPct: alloc.targetPct },
      create: alloc,
    });
  }

  // Seed OCR engine setting
  await prisma.settings.upsert({
    where: { key: "ocr_engine" },
    update: {},
    create: { key: "ocr_engine", value: "gemini" },
  });

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
