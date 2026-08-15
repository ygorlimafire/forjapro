-- Add isCustomizable to Product
ALTER TABLE "Product" ADD COLUMN "isCustomizable" BOOLEAN NOT NULL DEFAULT false;

-- Add custom fields to SalesProposalItem and make productId nullable
ALTER TABLE "SalesProposalItem" ADD COLUMN "isCustomItem" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SalesProposalItem" ADD COLUMN "customCost" DECIMAL(10,2);
ALTER TABLE "SalesProposalItem" ADD COLUMN "customSpecs" TEXT;
ALTER TABLE "SalesProposalItem" ALTER COLUMN "productId" DROP NOT NULL;

-- Add productName to SalesOrderItem and make productId nullable
ALTER TABLE "SalesOrderItem" ADD COLUMN "productName" TEXT;
ALTER TABLE "SalesOrderItem" ALTER COLUMN "productId" DROP NOT NULL;
