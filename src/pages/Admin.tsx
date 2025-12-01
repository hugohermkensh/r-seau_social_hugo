import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { userStorage, currentUserStorage } from "@/lib/storage";
import { hashPassword } from "@/lib/auth";
import { Shield, UserPlus, Trash2, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppLayout } from "@/components/AppLayout";

const Admin = () => {
  const navigate = useNavigate();
  const currentUser = currentUserStorage.get();
  const [users, setUsers] = useState(userStorage.getAll());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Form states
  const [newPseudo, setNewPseudo] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setUsers(userStorage.getAll());
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (newPseudo.length < 2 || newPseudo.length > 20) {
        toast.error("Le pseudo doit contenir entre 2 et 20 caractères");
        return;
      }

      if (newPassword.length < 8) {
        toast.error("Le mot de passe doit contenir au moins 8 caractères");
        return;
      }

      // Check if user already exists
      if (userStorage.getByPseudo(newPseudo)) {
        toast.error("Ce pseudo existe déjà");
        return;
      }

      // Hash password
      const hashedPassword = await hashPassword(newPassword);

      // Create user
      const newUser = userStorage.create({
        pseudo: newPseudo,
        code: hashedPassword,
        role: newRole,
      });

      setUsers(userStorage.getAll());
      toast.success(`Utilisateur ${newPseudo} créé avec succès`);
      setIsCreateDialogOpen(false);
      setNewPseudo("");
      setNewPassword("");
      setNewRole("user");
    } catch (error) {
      toast.error("Erreur lors de la création de l'utilisateur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error("Vous ne pouvez pas supprimer votre propre compte");
      return;
    }

    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.pseudo} ?`)) {
      userStorage.delete(userId);
      setUsers(userStorage.getAll());
      toast.success(`Utilisateur ${user.pseudo} supprimé`);
    }
  };

  const handleReset = async () => {
    const password = prompt("⚠️ ATTENTION CRITIQUE: Cette action effacera TOUTES les données sauf les comptes utilisateurs.\n\n🔐 Entrez le code de sécurité admin pour continuer:");
    
    if (!password) return;

    if (password !== "131009") {
      toast.error("❌ Code de sécurité incorrect");
      return;
    }

    if (confirm("🚨 CONFIRMATION FINALE 🚨\n\nÊtes-vous ABSOLUMENT CERTAIN de vouloir:\n✗ Supprimer TOUS les posts\n✗ Supprimer TOUTES les stories\n✗ Supprimer TOUS les messages privés\n✗ Supprimer TOUS les groupes\n\n⚠️ Cette action est IRRÉVERSIBLE !\n\nLes comptes utilisateurs seront préservés.")) {
      const { resetAllContent } = await import("@/lib/storage");
      resetAllContent(true);
      toast.success("✅ Réinitialisation totale effectuée - Tous les contenus ont été effacés (comptes préservés)");
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };
  
  const handleResetUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user || userId === currentUser?.id) {
      toast.error("Action impossible");
      return;
    }

    if (confirm(`🗑️ Supprimer TOUT le contenu de ${user.pseudo}?\n\n• Tous ses posts\n• Toutes ses stories\n• Tous ses messages\n• Ses participations aux groupes\n\nLe compte sera préservé mais vidé.`)) {
      const { resetUserContent } = require("@/lib/storage");
      resetUserContent(userId);
      toast.success(`Contenu de ${user.pseudo} effacé`);
      setUsers(userStorage.getAll());
    }
  };
  
  const handleToggleRole = (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error("Vous ne pouvez pas modifier votre propre rôle");
      return;
    }
    
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const newRole = user.role === "admin" ? "user" : "admin";
    const updated = userStorage.update(userId, { role: newRole });
    
    if (updated) {
      setUsers(userStorage.getAll());
      toast.success(`${user.pseudo} est maintenant ${newRole === "admin" ? "administrateur" : "utilisateur"}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/feed")}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-xl glow-border neon-button">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold glow-text">🛡️ Administration Elite</h1>
                <p className="text-muted-foreground">Contrôle total du réseau social</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleReset}
              variant="destructive"
              className="hover:opacity-90 neon-button glow-border"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              🔥 RESET Total
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-border neon-button">
                  <UserPlus className="mr-2 h-4 w-4" />
                  ➕ Créer un utilisateur
                </Button>
              </DialogTrigger>
            <DialogContent className="glass-effect border-primary/30">
              <DialogHeader>
                <DialogTitle className="glow-text">Créer un nouvel utilisateur</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau membre au réseau social
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pseudo">Pseudo</Label>
                  <Input
                    id="pseudo"
                    value={newPseudo}
                    onChange={(e) => setNewPseudo(e.target.value)}
                    placeholder="Pseudo de l'utilisateur"
                    className="bg-secondary/50 border-border/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mot de passe (min 8 caractères)"
                    className="bg-secondary/50 border-border/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select value={newRole} onValueChange={(value: "user" | "admin") => setNewRole(value)}>
                    <SelectTrigger className="bg-secondary/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Utilisateur</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-border"
                >
                  {isLoading ? "Création..." : "Créer l'utilisateur"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Users Table */}
        <Card className="glass-effect border-primary/30">
          <CardHeader>
            <CardTitle>Utilisateurs ({users.length})</CardTitle>
            <CardDescription>
              Liste de tous les membres du réseau
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pseudo</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead>Statistiques</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const userPosts = userStorage.getUserStats(user.id);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.pseudo}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          <span className="text-primary">📝 {userPosts.posts} posts</span>
                          <span className="text-accent">📖 {userPosts.stories} stories</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {user.id !== currentUser?.id && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleRole(user.id)}
                                className="hover:bg-primary/10 hover:text-primary"
                                title={user.role === "admin" ? "Rétrograder en utilisateur" : "Promouvoir en admin"}
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleResetUser(user.id)}
                                className="hover:bg-destructive/10 hover:text-destructive"
                                title="Effacer tout le contenu de cet utilisateur"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(user.id)}
                                className="hover:bg-destructive/20 hover:text-destructive"
                                title="Supprimer définitivement le compte"
                              >
                                <Trash2 className="h-4 w-4 fill-current" />
                              </Button>
                            </>
                          )}
                          {user.id === currentUser?.id && (
                            <Badge variant="secondary" className="text-xs">Vous</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
