-- CreateTable
CREATE TABLE "Holding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "costBasis" REAL,
    "costCurrency" TEXT NOT NULL DEFAULT 'TWD',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Debt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "principalTotal" REAL NOT NULL,
    "remainingBalance" REAL NOT NULL,
    "interestRate" REAL NOT NULL,
    "remainingTerms" INTEGER NOT NULL,
    "monthlyPayment" REAL NOT NULL,
    "startDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PortfolioSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "totalNetWorth" REAL NOT NULL,
    "twStockValue" REAL NOT NULL,
    "usStockValue" REAL NOT NULL,
    "cryptoValue" REAL NOT NULL,
    "cashValue" REAL NOT NULL,
    "debtValue" REAL NOT NULL,
    "fxRateUsdTwd" REAL NOT NULL,
    "snapshotData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TargetAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "targetPct" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "OcrUpload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "imageName" TEXT NOT NULL,
    "rawOcrText" TEXT NOT NULL,
    "parsedData" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Holding_category_symbol_key" ON "Holding"("category", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "TargetAllocation_category_key" ON "TargetAllocation"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");
