import { useState, useEffect } from "react";
import { storageMonitor } from "@/lib/secureStorage";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const StorageMonitor = () => {
  const [usage, setUsage] = useState(storageMonitor.getUsage());
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});

  useEffect(() => {
    setUsage(storageMonitor.getUsage());
    setBreakdown(storageMonitor.getBreakdown());
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const labelMap: Record<string, string> = {
    reseau_potes_users: "Utilisateurs",
    reseau_potes_posts: "Publications",
    reseau_potes_stories: "Stories",
    reseau_potes_messages: "Messages",
    reseau_potes_groups: "Groupes",
    reseau_potes_events: "Événements",
    reseau_potes_notifications: "Notifications",
    reseau_potes_audit_log: "Logs d'audit",
    reseau_potes_activity: "Activité",
    reseau_potes_blocked_users: "Bloqués",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Database className="h-4 w-4" />
          Stockage local
          {usage.percentage > 80 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {usage.percentage}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{formatBytes(usage.used)}</span>
            <span>{formatBytes(usage.total)}</span>
          </div>
          <Progress value={usage.percentage} className="h-2" />
        </div>
        
        <div className="space-y-1.5">
          {Object.entries(breakdown)
            .sort(([, a], [, b]) => b - a)
            .map(([key, bytes]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-muted-foreground truncate">
                  {labelMap[key] || key.replace("reseau_potes_", "")}
                </span>
                <span className="font-mono text-foreground">{formatBytes(bytes)}</span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};
