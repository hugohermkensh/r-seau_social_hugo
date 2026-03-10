import { useState, useEffect } from "react";
import { auditLog, type AuditEntry } from "@/lib/secureStorage";
import { userStorage } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Search, Trash2, RefreshCw } from "lucide-react";
import { formatTimestamp } from "@/lib/utils";

const actionLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  login: { label: "Connexion", variant: "default" },
  login_failed: { label: "Échec connexion", variant: "destructive" },
  logout: { label: "Déconnexion", variant: "secondary" },
  session_created: { label: "Session créée", variant: "default" },
  session_destroyed: { label: "Session fermée", variant: "secondary" },
  post_created: { label: "Post créé", variant: "outline" },
  post_deleted: { label: "Post supprimé", variant: "destructive" },
  message_sent: { label: "Message envoyé", variant: "outline" },
  user_created: { label: "Utilisateur créé", variant: "default" },
  user_deleted: { label: "Utilisateur supprimé", variant: "destructive" },
  user_blocked: { label: "Utilisateur bloqué", variant: "destructive" },
  user_unblocked: { label: "Utilisateur débloqué", variant: "default" },
  password_changed: { label: "MDP changé", variant: "secondary" },
  profile_updated: { label: "Profil modifié", variant: "outline" },
  data_exported: { label: "Export données", variant: "secondary" },
  data_imported: { label: "Import données", variant: "secondary" },
  content_reset: { label: "Contenu réinitialisé", variant: "destructive" },
};

export const AuditLogViewer = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [limit, setLimit] = useState(50);

  const loadEntries = () => {
    const all = auditLog.getRecent(limit);
    setEntries(all);
  };

  useEffect(() => {
    loadEntries();
  }, [limit]);

  const getUserName = (userId: string): string => {
    const user = userStorage.getById(userId);
    return user?.pseudo || userId.substring(0, 8);
  };

  const filteredEntries = entries.filter(e => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      e.action.toLowerCase().includes(q) ||
      getUserName(e.userId).toLowerCase().includes(q) ||
      JSON.stringify(e.details || {}).toLowerCase().includes(q)
    );
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Journal d'audit ({entries.length} entrées)
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={loadEntries}>
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { auditLog.clear(); loadEntries(); }}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Filtrer les logs..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {filteredEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Aucun log</p>
            ) : (
              filteredEntries.map(entry => {
                const actionInfo = actionLabels[entry.action] || { label: entry.action, variant: "outline" as const };
                return (
                  <div key={entry.id} className="flex items-start gap-2 p-2 rounded-md bg-muted/30 text-xs">
                    <Badge variant={actionInfo.variant} className="text-[10px] shrink-0">
                      {actionInfo.label}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{getUserName(entry.userId)}</span>
                      {entry.details && Object.keys(entry.details).length > 0 && (
                        <span className="text-muted-foreground ml-1">
                          {JSON.stringify(entry.details).substring(0, 60)}
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground shrink-0 text-[10px]">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          {entries.length >= limit && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => setLimit(l => l + 50)}
            >
              Charger plus
            </Button>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
