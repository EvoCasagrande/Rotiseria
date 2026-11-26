ALTER TABLE "Product" ADD COLUMN "ingredients" TEXT, ADD COLUMN "allergens" TEXT;
CREATE TABLE "BusinessSettings" (
  "id" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessSettings_pkey" PRIMARY KEY ("id")
);
