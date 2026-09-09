-- Store the percentage discount separately from the base product price.
ALTER TABLE "Product"
  ADD COLUMN "discountPercent" INTEGER NOT NULL DEFAULT 0;
