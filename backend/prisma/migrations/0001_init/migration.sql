CREATE TYPE "EventType" AS ENUM ('BONUS', 'CRISIS', 'TWIST');
CREATE TYPE "UpgradeType" AS ENUM ('COMBO', 'BOT', 'TREND', 'SKIN', 'STUDIO');

CREATE TABLE "User" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR(24) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "GameState" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL UNIQUE,
  "hype" DECIMAL(30,2) NOT NULL DEFAULT 0,
  "lifetimeHype" DECIMAL(30,2) NOT NULL DEFAULT 0,
  "clickPower" DECIMAL(20,2) NOT NULL DEFAULT 1,
  "hypePerSecond" DECIMAL(20,2) NOT NULL DEFAULT 0,
  "premiumCurrency" INTEGER NOT NULL DEFAULT 0,
  "stage" INTEGER NOT NULL DEFAULT 1,
  "comboLevel" INTEGER NOT NULL DEFAULT 0,
  "botLevel" INTEGER NOT NULL DEFAULT 0,
  "trendLevel" INTEGER NOT NULL DEFAULT 0,
  "skinLevel" INTEGER NOT NULL DEFAULT 0,
  "studioLevel" INTEGER NOT NULL DEFAULT 0,
  "activeSkin" VARCHAR(255) NOT NULL DEFAULT 'classic',
  "comboCount" INTEGER NOT NULL DEFAULT 0,
  "comboExpiresAt" TIMESTAMP(3),
  "activeEvent" VARCHAR(255),
  "eventMultiplier" DECIMAL(10,2) NOT NULL DEFAULT 1,
  "eventExpiresAt" TIMESTAMP(3),
  "boosterExpiresAt" TIMESTAMP(3),
  "lastTickAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "UpgradePurchase" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "type" "UpgradeType" NOT NULL,
  "level" INTEGER NOT NULL,
  "costHype" DECIMAL(30,2),
  "costMemes" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "GameEvent" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "type" "EventType" NOT NULL,
  "code" VARCHAR(64) NOT NULL,
  "multiplier" DECIMAL(10,2) NOT NULL DEFAULT 1,
  "durationSec" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "GameState" ADD CONSTRAINT "GameState_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UpgradePurchase" ADD CONSTRAINT "UpgradePurchase_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GameEvent" ADD CONSTRAINT "GameEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "UpgradePurchase_userId_type_idx" ON "UpgradePurchase"("userId", "type");
CREATE INDEX "GameEvent_userId_createdAt_idx" ON "GameEvent"("userId", "createdAt");
