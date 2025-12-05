import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { userStorage, currentUserStorage, groupStorage, messageStorage, postStorage, storyStorage, eventStorage, type Group } from "@/lib/storage";
import { hashPassword, isAdmin } from "@/lib/auth";
import { blockStorage } from "@/lib/notifications";
import { 
  Shield, UserPlus, Trash2, Users, MessageSquare, Plus, 
  BarChart3, UserCog, Settings, AlertTriangle, RefreshCw,
  Eye, Ban, Crown, Lock, Unlock, KeyRound
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppLayout } from "@/components/AppLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

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
  
  // Group management
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // Block management
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockUserId, setBlockUserId] = useState<string | null>(null);
  const [blockCode, setBlockCode] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalStories: 0,
    totalMessages: 0,
    totalGroups: 0,
    totalEvents: 0,
    admins: 0,
    regularUsers: 0,
  });

  useEffect(() => {
    if (!currentUser || !isAdmin(currentUser.id)) {
      navigate("/feed");
      return;
    }
    loadData();
  }, [currentUser, navigate]);

  const loadData = () => {
    const allUsers = userStorage.getAll();
    setUsers(allUsers);
    loadGroups();
    
    // Load blocked users
    const blocked = blockStorage.getAll();
    setBlockedUsers(blocked.map(b => b.userId));
    
    // Calculate stats
    const posts = postStorage.getAll();
    const stories = storyStorage.getAll();
    const messages = messageStorage.getAll();
    const allGroups = groupStorage.getAll();
    const events = eventStorage.getAll();
    
    setStats({
      totalUsers: allUsers.length,
      totalPosts: posts.length,
      totalStories: stories.length,
      totalMessages: messages.length,
      totalGroups: allGroups.length,
      totalEvents: events.length,
      admins: allUsers.filter(u => u.role === "admin").length,
      regularUsers: allUsers.filter(u => u.role === "user").length,
    });
  };

  const loadGroups = () => {
    const allGroups = groupStorage.getAll();
    setGroups(allGroups);
  };

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

      if (userStorage.getByPseudo(newPseudo)) {
        toast.error("Ce pseudo existe déjà");
        return;
      }

      const hashedPassword = await hashPassword(newPassword);

      userStorage.create({
        pseudo: newPseudo,
        code: hashedPassword,
        role: newRole,
      });

      loadData();
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
      loadData();
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
      toast.success("✅ Réinitialisation totale effectuée");
      
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
      loadData();
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
      loadData();
      toast.success(`${user.pseudo} est maintenant ${newRole === "admin" ? "administrateur" : "utilisateur"}`);
    }
  };

  const handleCreateGroup = () => {
    if (!currentUser || !groupName.trim() || selectedMembers.length === 0) {
      toast.error("Veuillez remplir tous les champs et sélectionner au moins un membre");
      return;
    }

    try {
      groupStorage.create({
        name: groupName.trim(),
        description: groupDescription.trim(),
        members: [currentUser.id, ...selectedMembers],
        createdBy: currentUser.id,
      });

      toast.success(`Groupe "${groupName}" créé avec succès`);
      setShowCreateGroup(false);
      setGroupName("");
      setGroupDescription("");
      setSelectedMembers([]);
      loadData();
    } catch (error) {
      toast.error("Erreur lors de la création du groupe");
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    if (confirm(`Supprimer le groupe "${group.name}" ?\n\nTous les messages du groupe seront également supprimés.`)) {
      const success = groupStorage.delete(groupId);
      if (success) {
        toast.success("Groupe supprimé avec succès");
        loadData();
      } else {
        toast.error("Erreur lors de la suppression du groupe");
      }
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Block user handlers
  const handleOpenBlockDialog = (userId: string) => {
    setBlockUserId(userId);
    setBlockCode("");
    setBlockReason("");
    setShowBlockDialog(true);
  };

  const handleBlockUser = () => {
    if (!blockUserId || blockCode.length < 4) {
      toast.error("Le code doit contenir au moins 4 caractères");
      return;
    }

    blockStorage.block(blockUserId, blockCode, blockReason);
    const user = users.find(u => u.id === blockUserId);
    toast.success(`${user?.pseudo || "Utilisateur"} a été bloqué`);
    setShowBlockDialog(false);
    setBlockUserId(null);
    setBlockCode("");
    setBlockReason("");
    loadData();
  };

  const handleUnblockUser = (userId: string) => {
    blockStorage.forceUnblock(userId);
    const user = users.find(u => u.id === userId);
    toast.success(`${user?.pseudo || "Utilisateur"} a été débloqué`);
    loadData();
  };

  if (!currentUser || !isAdmin(currentUser.id)) return null;

  return (
    <AppLayout>
      <div className="min-h-screen p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-neon">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold glow-text">Administration</h1>
                <p className="text-muted-foreground">Panneau de contrôle du réseau</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="gradient" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Nouvel utilisateur
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-effect border-primary/30">
                  <DialogHeader>
                    <DialogTitle className="glow-text flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Créer un utilisateur
                    </DialogTitle>
                    <DialogDescription>
                      Ajoutez un nouveau membre au réseau social
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
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
                      variant="gradient"
                      className="w-full"
                    >
                      {isLoading ? "Création..." : "Créer l'utilisateur"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <Button onClick={handleReset} variant="destructive" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Reset total
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card className="glass-effect border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{stats.totalUsers}</p>
                    <p className="text-xs text-muted-foreground">Utilisateurs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-accent/20 hover:border-accent/40 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">{stats.totalMessages}</p>
                    <p className="text-xs text-muted-foreground">Messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{stats.totalPosts}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-accent/20 hover:border-accent/40 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <Eye className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">{stats.totalStories}</p>
                    <p className="text-xs text-muted-foreground">Stories</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{stats.totalGroups}</p>
                    <p className="text-xs text-muted-foreground">Groupes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-accent/20 hover:border-accent/40 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <Crown className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">{stats.admins}</p>
                    <p className="text-xs text-muted-foreground">Admins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="bg-card/50 border border-border/50 p-1">
              <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <UserCog className="w-4 h-4" />
                Utilisateurs
              </TabsTrigger>
              <TabsTrigger value="groups" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="w-4 h-4" />
                Groupes
              </TabsTrigger>
              <TabsTrigger value="messages" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MessageSquare className="w-4 h-4" />
                Messages
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card className="glass-effect border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="w-5 h-5 text-primary" />
                    Gestion des utilisateurs
                  </CardTitle>
                  <CardDescription>
                    {stats.totalUsers} utilisateurs • {stats.admins} admins • {stats.regularUsers} membres
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {users.map((user) => {
                        const userStats = userStorage.getUserStats(user.id);
                        const isCurrentUser = user.id === currentUser?.id;
                        
                        return (
                          <div
                            key={user.id}
                            className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                              isCurrentUser 
                                ? "bg-primary/10 border border-primary/30" 
                                : "bg-secondary/30 hover:bg-secondary/50 border border-transparent hover:border-border/50"
                            }`}
                          >
                            <Avatar className="h-12 w-12 border-2 border-primary/30">
                              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold">
                                {getInitials(user.pseudo)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold truncate">{user.pseudo}</span>
                                {user.role === "admin" && (
                                  <Badge className="bg-accent/20 text-accent border-accent/30">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Admin
                                  </Badge>
                                )}
                                {blockedUsers.includes(user.id) && (
                                  <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                                    <Lock className="w-3 h-3 mr-1" />
                                    Bloqué
                                  </Badge>
                                )}
                                {isCurrentUser && (
                                  <Badge variant="outline" className="text-xs">Vous</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{userStats.posts} posts</span>
                                <span>{userStats.stories} stories</span>
                                <span>{userStats.likes} likes</span>
                                <span>Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
                              </div>
                            </div>
                            
                            {!isCurrentUser && (
                              <div className="flex gap-1">
                                {blockedUsers.includes(user.id) ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleUnblockUser(user.id)}
                                    className="hover:bg-primary/20 hover:text-primary"
                                    title="Débloquer"
                                  >
                                    <Unlock className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenBlockDialog(user.id)}
                                    className="hover:bg-destructive/20 hover:text-destructive"
                                    title="Bloquer l'accès"
                                  >
                                    <Lock className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleRole(user.id)}
                                  className="hover:bg-accent/20 hover:text-accent"
                                  title={user.role === "admin" ? "Rétrograder" : "Promouvoir admin"}
                                >
                                  <Crown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleResetUser(user.id)}
                                  className="hover:bg-destructive/20 hover:text-destructive"
                                  title="Effacer le contenu"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="hover:bg-destructive/20 hover:text-destructive"
                                  title="Supprimer le compte"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Groups Tab */}
            <TabsContent value="groups">
              <Card className="glass-effect border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Gestion des groupes
                      </CardTitle>
                      <CardDescription>
                        {groups.length} groupes actifs
                      </CardDescription>
                    </div>
                    <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                      <DialogTrigger asChild>
                        <Button variant="gradient" size="sm" className="gap-2">
                          <Plus className="w-4 h-4" />
                          Nouveau groupe
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-effect border-primary/30 max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="glow-text flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Créer un groupe
                          </DialogTitle>
                          <DialogDescription>
                            Créez un nouveau groupe de discussion
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="space-y-2">
                            <Label>Nom du groupe *</Label>
                            <Input
                              value={groupName}
                              onChange={(e) => setGroupName(e.target.value)}
                              placeholder="Mon groupe"
                              maxLength={50}
                              className="bg-secondary/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={groupDescription}
                              onChange={(e) => setGroupDescription(e.target.value)}
                              placeholder="Description du groupe..."
                              className="bg-secondary/50 resize-none"
                              rows={2}
                              maxLength={200}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Membres ({selectedMembers.length} sélectionnés)</Label>
                            <ScrollArea className="h-48 rounded-lg border border-border/50 p-3">
                              <div className="space-y-2">
                                {users.filter(u => u.id !== currentUser?.id).map((user) => (
                                  <div
                                    key={user.id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                                    onClick={() => toggleMember(user.id)}
                                  >
                                    <Checkbox
                                      checked={selectedMembers.includes(user.id)}
                                      onCheckedChange={() => toggleMember(user.id)}
                                    />
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
                                        {getInitials(user.pseudo)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-sm">{user.pseudo}</span>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>

                          <Button
                            onClick={handleCreateGroup}
                            disabled={!groupName.trim() || selectedMembers.length === 0}
                            variant="gradient"
                            className="w-full"
                          >
                            Créer le groupe
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    {groups.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                        <p className="text-muted-foreground">Aucun groupe créé</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {groups.map((group) => {
                          const creator = userStorage.getById(group.createdBy);
                          const messageCount = messageStorage.getGroupMessages(group.id).length;
                          
                          return (
                            <div
                              key={group.id}
                              className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all"
                            >
                              <div className="p-3 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl">
                                <Users className="w-6 h-6 text-primary" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">{group.name}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {group.members.length} membres
                                  </Badge>
                                </div>
                                {group.description && (
                                  <p className="text-sm text-muted-foreground truncate mb-1">
                                    {group.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>Créé par {creator?.pseudo || "Inconnu"}</span>
                                  <span>•</span>
                                  <span>{messageCount} messages</span>
                                </div>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteGroup(group.id)}
                                className="hover:bg-destructive/20 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages">
              <Card className="glass-effect border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Statistiques des messages
                  </CardTitle>
                  <CardDescription>
                    Aperçu de l'activité de messagerie
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                      <MessageSquare className="w-8 h-8 text-primary mb-3" />
                      <p className="text-3xl font-bold text-primary mb-1">{stats.totalMessages}</p>
                      <p className="text-sm text-muted-foreground">Messages totaux</p>
                    </div>
                    
                    <div className="p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                      <Users className="w-8 h-8 text-accent mb-3" />
                      <p className="text-3xl font-bold text-accent mb-1">{stats.totalGroups}</p>
                      <p className="text-sm text-muted-foreground">Groupes actifs</p>
                    </div>
                    
                    <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border/20">
                      <BarChart3 className="w-8 h-8 text-foreground mb-3" />
                      <p className="text-3xl font-bold mb-1">
                        {stats.totalMessages > 0 
                          ? Math.round(stats.totalMessages / Math.max(stats.totalUsers, 1)) 
                          : 0
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">Moy. par utilisateur</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Block User Dialog */}
          <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
            <DialogContent className="glass-effect border-destructive/30">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <Lock className="w-5 h-5" />
                  Bloquer l'accès utilisateur
                </DialogTitle>
                <DialogDescription>
                  Définissez un code d'accès pour débloquer ce compte ultérieurement.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="blockCode">Code de déblocage</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="blockCode"
                      type="password"
                      value={blockCode}
                      onChange={(e) => setBlockCode(e.target.value)}
                      placeholder="Code secret (min 4 caractères)"
                      className="pl-10 bg-secondary/50 border-border/50"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ce code sera nécessaire pour débloquer le compte
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blockReason">Raison (optionnel)</Label>
                  <Textarea
                    id="blockReason"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Raison du blocage..."
                    className="bg-secondary/50 border-border/50 resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowBlockDialog(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleBlockUser}
                    disabled={blockCode.length < 4}
                    className="flex-1"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Bloquer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AppLayout>
  );
};

export default Admin;
