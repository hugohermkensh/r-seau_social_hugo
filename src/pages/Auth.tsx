import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Auth = () => {
  const [pseudo, setPseudo] = useState("");
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pseudo || !code) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    // Mock authentication - À remplacer par vraie authentification locale
    if (code.length >= 4) {
      localStorage.setItem("user", JSON.stringify({ pseudo, id: Date.now() }));
      toast.success(`Bienvenue ${pseudo} !`);
      navigate("/feed");
    } else {
      toast.error("Code invalide (minimum 4 caractères)");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 animate-pulse-glow" />
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <Card className="w-full max-w-md glass-effect border-primary/30 relative z-10 animate-slide-up">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-4 glow-border">
            <span className="text-3xl font-bold glow-text">🚀</span>
          </div>
          <CardTitle className="text-3xl font-bold glow-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Réseau Potes
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Connecte-toi à ton réseau privé
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pseudo" className="text-foreground">
                Pseudo
              </Label>
              <Input
                id="pseudo"
                type="text"
                placeholder="Ton pseudo"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                className="bg-secondary/50 border-border/50 focus:border-primary transition-all duration-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code" className="text-foreground">
                Code d'accès
              </Label>
              <Input
                id="code"
                type="password"
                placeholder="••••"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="bg-secondary/50 border-border/50 focus:border-primary transition-all duration-300"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 glow-border text-primary-foreground font-semibold"
            >
              Se connecter
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Réseau 100% local et sécurisé
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
