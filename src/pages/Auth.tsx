import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { userStorage, currentUserStorage, initializeAdmin } from "@/lib/storage";
import { verifyPassword } from "@/lib/auth";
import { blockStorage } from "@/lib/notifications";
import { BlockedUserScreen } from "@/components/BlockedUserScreen";
import { rateLimiter } from "@/lib/rateLimiter";
import { sessionManager, auditLog } from "@/lib/secureStorage";
import { Shield, Lock, AlertTriangle } from "lucide-react";

const Auth = () => {
  const [pseudo, setPseudo] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [blockedUser, setBlockedUser] = useState<any>(null);
  const [lockoutTime, setLockoutTime] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    initializeAdmin();
  }, []);

  // Check lockout timer
  useEffect(() => {
    const checkLockout = () => {
      const { locked, remainingMs } = rateLimiter.isLocked("login");
      if (locked) {
        setLockoutTime(rateLimiter.formatTime(remainingMs));
      } else {
        setLockoutTime(null);
      }
    };
    
    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check rate limit
      const { locked, remainingMs } = rateLimiter.isLocked("login");
      if (locked) {
        toast.error(`Trop de tentatives. Réessayez dans ${rateLimiter.formatTime(remainingMs)}`);
        setIsLoading(false);
        return;
      }

      if (!pseudo || !code) {
        toast.error("Veuillez remplir tous les champs");
        setIsLoading(false);
        return;
      }

      const user = userStorage.getByPseudo(pseudo);

      if (!user) {
        const result = rateLimiter.recordAttempt("login");
        if (result.blocked) {
          toast.error(`Compte verrouillé pendant 5 minutes`);
        } else {
          toast.error(`Identifiants incorrects (${result.remainingAttempts} tentatives restantes)`);
        }
        setIsLoading(false);
        return;
      }

      const isValidPassword = await verifyPassword(code, user.code);
      
      if (!isValidPassword) {
        const result = rateLimiter.recordAttempt("login");
        if (result.blocked) {
          toast.error(`Compte verrouillé pendant 5 minutes`);
        } else {
          toast.error(`Identifiants incorrects (${result.remainingAttempts} tentatives restantes)`);
        }
        setIsLoading(false);
        return;
      }

      // Check if user is blocked
      if (blockStorage.isBlocked(user.id)) {
        const blockInfo = blockStorage.getBlockInfo(user.id);
        setBlockedUser({ ...blockInfo, user });
        setIsLoading(false);
        return;
      }

      // Success - reset rate limit
      rateLimiter.reset("login");
      toast.success(`Bienvenue ${user.pseudo} !`);
      currentUserStorage.set(user);
      navigate("/feed");
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  if (blockedUser) {
    return (
      <BlockedUserScreen 
        blockInfo={blockedUser} 
        onUnlock={() => {
          setBlockedUser(null);
          currentUserStorage.set(blockedUser.user);
          navigate("/feed");
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden safe-area-inset-top safe-area-inset-bottom">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      
      {/* Animated grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: 'linear-gradient(hsl(180 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(180 100% 50%) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} 
      />
      
      {/* Floating orbs */}
      <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-32 sm:w-64 h-32 sm:h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-48 sm:w-96 h-48 sm:h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

      <Card className="w-full max-w-md glass-effect border-primary/30 relative z-10 animate-slide-up overflow-hidden">
        {/* Scan line effect */}
        <div className="absolute inset-0 scan-line pointer-events-none z-10" />
        
        <CardHeader className="text-center space-y-3 px-4 sm:px-6 relative">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-2 glow-border relative">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl animate-pulse opacity-30" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold gradient-text-animated">
            Réseau Potes
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Réseau social privé • Accès sécurisé
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6 relative">
          {lockoutTime && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">
                Trop de tentatives. Verrouillé pendant {lockoutTime}
              </p>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pseudo" className="text-foreground text-sm flex items-center gap-2">
                <Lock className="w-3 h-3 text-primary" />
                Pseudo
              </Label>
              <Input
                id="pseudo"
                type="text"
                placeholder="Ton pseudo"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                className="bg-secondary/50 border-border/50 focus:border-primary transition-all duration-300 h-11 sm:h-10 text-base sm:text-sm"
                autoComplete="username"
                autoCapitalize="off"
                autoCorrect="off"
                disabled={!!lockoutTime}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code" className="text-foreground text-sm flex items-center gap-2">
                <Lock className="w-3 h-3 text-accent" />
                Code d'accès
              </Label>
              <Input
                id="code"
                type="password"
                placeholder="••••••••"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="bg-secondary/50 border-border/50 focus:border-primary transition-all duration-300 h-11 sm:h-10 text-base sm:text-sm"
                autoComplete="current-password"
                disabled={!!lockoutTime}
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !!lockoutTime}
              className="w-full h-11 sm:h-10 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 glow-border text-primary-foreground font-semibold text-base sm:text-sm ripple-effect"
            >
              {isLoading ? "Connexion..." : lockoutTime ? `Verrouillé (${lockoutTime})` : "Se connecter"}
            </Button>

            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>100% local & sécurisé</span>
              <span>•</span>
              <span>Accès réservé</span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
