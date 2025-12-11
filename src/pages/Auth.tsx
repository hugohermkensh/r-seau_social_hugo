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
import { ZodError } from "zod";

const Auth = () => {
  const [pseudo, setPseudo] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [blockedUser, setBlockedUser] = useState<any>(null);
  const navigate = useNavigate();

  // Initialize admin user
  useEffect(() => {
    initializeAdmin();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!pseudo || !code) {
        toast.error("Veuillez remplir tous les champs");
        return;
      }

      // Check if user exists
      const user = userStorage.getByPseudo(pseudo);

      if (!user) {
        toast.error("Identifiants incorrects");
        setIsLoading(false);
        return;
      }

      // Verify password
      const isValidPassword = await verifyPassword(code, user.code);
      
      if (!isValidPassword) {
        toast.error("Identifiants incorrects");
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

      toast.success(`Bienvenue ${user.pseudo} !`);

      // Save current user
      currentUserStorage.set(user);
      navigate("/feed");
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  // Show blocked screen if user is blocked
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
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 animate-pulse-glow" />
      
      {/* Floating orbs - reduced size on mobile */}
      <div className="absolute top-10 sm:top-20 left-10 sm:left-20 w-32 sm:w-64 h-32 sm:h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-48 sm:w-96 h-48 sm:h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <Card className="w-full max-w-md glass-effect border-primary/30 relative z-10 animate-slide-up">
        <CardHeader className="text-center space-y-2 px-4 sm:px-6">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-3 sm:mb-4 glow-border">
            <span className="text-2xl sm:text-3xl font-bold glow-text">🚀</span>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold glow-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Réseau Potes
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Connecte-toi à ton réseau privé
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pseudo" className="text-foreground text-sm">
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code" className="text-foreground text-sm">
                Code d'accès
              </Label>
              <Input
                id="code"
                type="password"
                placeholder="••••"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="bg-secondary/50 border-border/50 focus:border-primary transition-all duration-300 h-11 sm:h-10 text-base sm:text-sm"
                autoComplete="current-password"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-11 sm:h-10 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 glow-border text-primary-foreground font-semibold text-base sm:text-sm"
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>

            <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
              Réseau 100% local et sécurisé • Accès réservé aux membres
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
