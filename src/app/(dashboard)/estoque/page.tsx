import { getStockList, getWarehouses } from "@/actions/stock"
import { StockPageContent } from "@/components/stock/stock-page-content"

export default async function EstoquePage() {
  const [items, warehouses] = await Promise.all([getStockList(), getWarehouses()])
  const defaultWarehouseId = warehouses[0]?.id ?? ""
  return <StockPageContent items={items} warehouseId={defaultWarehouseId} />
}
