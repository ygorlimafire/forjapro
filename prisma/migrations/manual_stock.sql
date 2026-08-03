-- Enums novos
DO $$ BEGIN
  CREATE TYPE "StockAlertStatus" AS ENUM ('OK','PARCIAL','INSUFICIENTE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MovementType" AS ENUM (
    'ENTRADA','SAIDA','AJUSTE','DEVOLUCAO',
    'PERDA','RESERVA','CANCELAMENTO_RESERVA'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ReservationStatus" AS ENUM ('ATIVA','BAIXADA','CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StockUnitStatus" AS ENUM ('EM_ESTOQUE','VENDIDO','GARANTIA','PERDA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Colunas novas em tabelas existentes
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "stockMin" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "SalesOrder"
  ADD COLUMN IF NOT EXISTS "stockStatus" "StockAlertStatus" NOT NULL DEFAULT 'OK';

-- Warehouse
CREATE TABLE IF NOT EXISTS "Warehouse" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Warehouse" ("id","name","isDefault","isActive","updatedAt")
SELECT gen_random_uuid()::text,'Estoque Principal',true,true,CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "Warehouse" WHERE "isDefault" = true);

-- StockMovement
CREATE TABLE IF NOT EXISTS "StockMovement" (
  "id"            TEXT NOT NULL,
  "productId"     TEXT NOT NULL,
  "warehouseId"   TEXT NOT NULL,
  "type"          "MovementType" NOT NULL,
  "quantity"      INTEGER NOT NULL,
  "unitCost"      DECIMAL(10,2),
  "totalCost"     DECIMAL(10,2),
  "reason"        TEXT,
  "referenceType" TEXT,
  "referenceId"   TEXT,
  "serialNumber"  TEXT,
  "userId"        TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StockMovement_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id"),
  CONSTRAINT "StockMovement_warehouseId_fkey"
    FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id"),
  CONSTRAINT "StockMovement_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
);

-- StockReservation
CREATE TABLE IF NOT EXISTS "StockReservation" (
  "id"          TEXT NOT NULL,
  "productId"   TEXT NOT NULL,
  "warehouseId" TEXT NOT NULL,
  "orderId"     TEXT NOT NULL,
  "quantity"    INTEGER NOT NULL,
  "status"      "ReservationStatus" NOT NULL DEFAULT 'ATIVA',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StockReservation_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id"),
  CONSTRAINT "StockReservation_warehouseId_fkey"
    FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id"),
  CONSTRAINT "StockReservation_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id")
);

-- StockUnit
CREATE TABLE IF NOT EXISTS "StockUnit" (
  "id"           TEXT NOT NULL,
  "productId"    TEXT NOT NULL,
  "warehouseId"  TEXT NOT NULL,
  "serialNumber" TEXT NOT NULL,
  "status"       "StockUnitStatus" NOT NULL DEFAULT 'EM_ESTOQUE',
  "orderId"      TEXT,
  "customerId"   TEXT,
  "soldAt"       TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockUnit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StockUnit_serialNumber_productId_key"
    UNIQUE ("serialNumber","productId"),
  CONSTRAINT "StockUnit_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id"),
  CONSTRAINT "StockUnit_warehouseId_fkey"
    FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id"),
  CONSTRAINT "StockUnit_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id"),
  CONSTRAINT "StockUnit_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
);

-- ProductStock
CREATE TABLE IF NOT EXISTS "ProductStock" (
  "id"           TEXT NOT NULL,
  "productId"    TEXT NOT NULL,
  "warehouseId"  TEXT NOT NULL,
  "physicalQty"  INTEGER NOT NULL DEFAULT 0,
  "reservedQty"  INTEGER NOT NULL DEFAULT 0,
  "availableQty" INTEGER NOT NULL DEFAULT 0,
  "avgCost"      DECIMAL(10,2) NOT NULL DEFAULT 0,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductStock_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductStock_productId_warehouseId_key"
    UNIQUE ("productId","warehouseId"),
  CONSTRAINT "ProductStock_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id"),
  CONSTRAINT "ProductStock_warehouseId_fkey"
    FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id")
);
