-- Rename OrderStatus enum value EM_PRODUCAO → AGUARDANDO_EXPEDICAO
-- Run this in Supabase SQL Editor

-- Step 1: Add new value to existing enum
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'AGUARDANDO_EXPEDICAO';

-- Step 2: Migrate existing rows
UPDATE "SalesOrder" SET status = 'AGUARDANDO_EXPEDICAO' WHERE status = 'EM_PRODUCAO';

-- Step 3: Rebuild the enum without EM_PRODUCAO
-- (PostgreSQL requires dropping and recreating the type)
ALTER TABLE "SalesOrder" ALTER COLUMN status TYPE TEXT;
DROP TYPE "OrderStatus";
CREATE TYPE "OrderStatus" AS ENUM ('PENDENTE', 'CONFIRMADO', 'AGUARDANDO_EXPEDICAO', 'ENTREGUE', 'CANCELADO');
ALTER TABLE "SalesOrder"
  ALTER COLUMN status TYPE "OrderStatus" USING status::"OrderStatus",
  ALTER COLUMN status SET DEFAULT 'PENDENTE';
