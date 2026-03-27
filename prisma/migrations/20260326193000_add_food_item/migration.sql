CREATE TABLE "FoodItem" (
  "id" TEXT NOT NULL,
  "barcode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "brand" TEXT,
  "servingSize" TEXT,
  "calories" INTEGER NOT NULL,
  "protein" INTEGER NOT NULL,
  "carbs" INTEGER NOT NULL,
  "fat" INTEGER NOT NULL,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FoodItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FoodItem_barcode_key" ON "FoodItem"("barcode");

ALTER TABLE "FoodItem" ADD CONSTRAINT "FoodItem_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
