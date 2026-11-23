-- Add nullable request fingerprints without changing existing orders.
ALTER TABLE "Order" ADD COLUMN "requestKeyHash" TEXT,
ADD COLUMN "requestPayloadHash" TEXT;
CREATE UNIQUE INDEX "Order_requestKeyHash_key" ON "Order"("requestKeyHash");
