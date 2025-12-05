import { useState } from "react";
import { Lock, ShieldAlert, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { blockStorage, type BlockedUser } from "@/lib/notifications";
import { toast } from "sonner";

interface BlockedUserScreenProps {
  blockInfo: BlockedUser;
  onUnlock: () => void;
}

export const BlockedUserScreen = ({ blockInfo, onUnlock }: BlockedUserScreenProps) => {
  const [unlockCode, setUnlockCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleUnlock = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      const success = blockStorage.unblock(blockInfo.userId, unlockCode);
      
      if (success) {
        toast.success("Compte débloqué avec succès");
        onUnlock();
      } else {
        setAttempts(prev => prev + 1);
        toast.error(`Code incorrect (tentative ${attempts + 1})`);
        setUnlockCode("");
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary/20 to-background">
      <Card className="w-full max-w-md glass-effect border-destructive/30 animate-fade-in">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-destructive animate-pulse" />
          </div>
          <CardTitle className="text-2xl text-destructive">Accès Bloqué</CardTitle>
          <CardDescription className="text-muted-foreground">
            Ce compte a été temporairement bloqué.
            {blockInfo.reason && (
              <span className="block mt-2 text-sm">
                Raison: <span className="font-medium">{blockInfo.reason}</span>
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-secondary/30 rounded-lg border border-border/30">
            <p className="text-sm text-muted-foreground text-center">
              Pour débloquer ce compte, entrez le code d'accès qui a été défini lors du blocage.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Code de déblocage"
                value={unlockCode}
                onChange={(e) => setUnlockCode(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              />
            </div>
            
            <Button
              onClick={handleUnlock}
              disabled={isLoading || unlockCode.length === 0}
              className="w-full"
              variant="gradient"
            >
              {isLoading ? (
                <>
                  <Lock className="w-4 h-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Débloquer le compte
                </>
              )}
            </Button>
          </div>

          {attempts >= 3 && (
            <p className="text-xs text-destructive text-center">
              Trop de tentatives. Contactez un administrateur.
            </p>
          )}

          <p className="text-xs text-muted-foreground/60 text-center">
            Bloqué le {new Date(blockInfo.blockedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
