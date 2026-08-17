CREATE TABLE "SkinUnlock" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "skin" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkinUnlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SkinUnlock_userId_skin_key" ON "SkinUnlock"("userId", "skin");
CREATE INDEX "SkinUnlock_userId_idx" ON "SkinUnlock"("userId");

ALTER TABLE "SkinUnlock" ADD CONSTRAINT "SkinUnlock_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
