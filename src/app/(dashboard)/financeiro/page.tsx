import { Card, CardContent } from "@/components/ui/card"
import { Construction } from "lucide-react"

export default function Page() {
  return (
    <div className="p-6">
      <Card>
        <CardContent className="py-20 text-center">
          <Construction size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">Em desenvolvimento</p>
          <p className="text-sm text-muted-foreground mt-1">Este módulo será implementado na próxima fase.</p>
        </CardContent>
      </Card>
    </div>
  )
}
