import { Card, CardContent } from "@/components/ui/card";
import { Clock, BarChart3 } from "lucide-react";

export default function ReportsContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
          <BarChart3 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
            Reports
          </h2>
          <p className="text-sm text-muted-foreground">
            Generate and view financial reports
          </p>
        </div>
      </div>

      <Card className="bg-card border border-border">
        <CardContent className="p-12 text-center">
          <Clock className="h-16 w-16 mx-auto mb-4 text-primary/50" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Coming Soon</h3>
          <p className="text-muted-foreground">
            Reports management is under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
