CREATE TABLE "SavedMeal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "mealId" TEXT NOT NULL,
  "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SavedMeal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeightEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "weightKg" DOUBLE PRECISION NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WeightEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SavedMeal_userId_mealId_key" ON "SavedMeal"("userId", "mealId");
CREATE INDEX "SavedMeal_userId_savedAt_idx" ON "SavedMeal"("userId", "savedAt");
CREATE INDEX "WeightEntry_userId_recordedAt_idx" ON "WeightEntry"("userId", "recordedAt");

ALTER TABLE "SavedMeal" ADD CONSTRAINT "SavedMeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SavedMeal" ADD CONSTRAINT "SavedMeal_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WeightEntry" ADD CONSTRAINT "WeightEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
