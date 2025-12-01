import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Terminal as TerminalIcon, Lock, X, Users, MessageSquare } from "lucide-react";
import { userStorage, postStorage, messageStorage, groupStorage, storyStorage, currentUserStorage, type Group } from "@/lib/storage";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";

const ADMIN_PASSWORD = "131009";

const Terminal = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([
    "🔐 Terminal de gestion - Réseau Social",
    "Entrez 'help' pour voir les commandes disponibles",
    ""
  ]);
  const [groups, setGroups] = useState<Group[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (isAuthenticated && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadGroups();
    }
  }, [isAuthenticated]);

  const loadGroups = () => {
    setGroups(groupStorage.getAll());
  };

  const addToHistory = (text: string) => {
    setHistory(prev => [...prev, text]);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      addToHistory("✅ Authentification réussie!");
      addToHistory("");
      toast.success("Accès autorisé au terminal");
    } else {
      addToHistory("❌ Mot de passe incorrect!");
      toast.error("Accès refusé");
      setPassword("");
    }
  };

  const executeCommand = (cmd: string) => {
    const parts = cmd.trim().toLowerCase().split(' ');
    const action = parts[0];

    addToHistory(`> ${cmd}`);

    switch (action) {
      case 'help':
        addToHistory("📋 Commandes disponibles:");
        addToHistory("  users - Liste tous les utilisateurs");
        addToHistory("  user <pseudo> - Détails d'un utilisateur");
        addToHistory("  adduser <pseudo> <password> - Créer un utilisateur");
        addToHistory("  deluser <pseudo> - Supprimer un utilisateur");
        addToHistory("  messages - Statistiques messages");
        addToHistory("  conversations - Toutes les conversations privées");
        addToHistory("  groups - Liste des groupes");
        addToHistory("  group <id> - Détails d'un groupe");
        addToHistory("  creategroup <nom> <id1> <id2> ... - Créer un groupe");
        addToHistory("  delgroup <id> - Supprimer un groupe");
        addToHistory("  posts - Statistiques publications");
        addToHistory("  stories - Statistiques stories");
        addToHistory("  search <term> - Rechercher un utilisateur");
        addToHistory("  clear - Effacer l'historique");
        addToHistory("  exit - Quitter le terminal");
        break;

      case 'users':
        const users = userStorage.getAll();
        addToHistory(`👥 ${users.length} utilisateur(s):`);
        users.forEach(u => {
          addToHistory(`  - ${u.pseudo} (${u.role}) - Créé: ${new Date(u.createdAt).toLocaleDateString()}`);
        });
        break;

      case 'user':
        if (parts.length < 2) {
          addToHistory("❌ Usage: user <pseudo>");
          break;
        }
        const targetUser = userStorage.getByPseudo(parts[1]);
        if (!targetUser) {
          addToHistory(`❌ Utilisateur '${parts[1]}' introuvable`);
          break;
        }
        const userPosts = postStorage.getByAuthor(targetUser.id);
        const userStories = storyStorage.getByAuthor(targetUser.id);
        addToHistory(`📋 Fiche utilisateur: ${targetUser.pseudo}`);
        addToHistory(`  ID: ${targetUser.id}`);
        addToHistory(`  Rôle: ${targetUser.role}`);
        addToHistory(`  Bio: ${targetUser.bio || 'Non définie'}`);
        addToHistory(`  Créé le: ${new Date(targetUser.createdAt).toLocaleString()}`);
        addToHistory(`  Publications: ${userPosts.length}`);
        addToHistory(`  Stories: ${userStories.length}`);
        break;

      case 'adduser':
        if (parts.length < 3) {
          addToHistory("❌ Usage: adduser <pseudo> <password>");
          break;
        }
        if (userStorage.getByPseudo(parts[1])) {
          addToHistory(`❌ L'utilisateur '${parts[1]}' existe déjà`);
          break;
        }
        // Note: In real app, hash the password
        userStorage.create({
          pseudo: parts[1],
          code: parts[2],
          role: 'user'
        });
        addToHistory(`✅ Utilisateur '${parts[1]}' créé`);
        toast.success(`Utilisateur ${parts[1]} créé`);
        break;

      case 'deluser':
        if (parts.length < 2) {
          addToHistory("❌ Usage: deluser <pseudo>");
          break;
        }
        const delUser = userStorage.getByPseudo(parts[1]);
        if (!delUser) {
          addToHistory(`❌ Utilisateur '${parts[1]}' introuvable`);
          break;
        }
        userStorage.delete(delUser.id);
        addToHistory(`✅ Utilisateur '${parts[1]}' supprimé`);
        toast.success(`Utilisateur ${parts[1]} supprimé`);
        break;

      case 'messages':
        const totalMessages = messageStorage.getAll();
        const privateMessages = totalMessages.filter(m => !m.groupId);
        const groupMessages = totalMessages.filter(m => m.groupId);
        addToHistory(`💬 Statistiques messages:`);
        addToHistory(`  Total: ${totalMessages.length}`);
        addToHistory(`  Messages privés: ${privateMessages.length}`);
        addToHistory(`  Messages de groupe: ${groupMessages.length}`);
        break;

      case 'conversations':
        const allMessages = messageStorage.getAll().filter(m => !m.groupId);
        const convos = new Map<string, { user1: string, user2: string, count: number }>();
        
        allMessages.forEach(msg => {
          const key = [msg.senderId, msg.receiverId].sort().join("-");
          if (!convos.has(key)) {
            convos.set(key, { 
              user1: msg.senderId, 
              user2: msg.receiverId || "", 
              count: 0 
            });
          }
          convos.get(key)!.count++;
        });

        if (convos.size === 0) {
          addToHistory("Aucune conversation privée");
        } else {
          addToHistory(`=== ${convos.size} conversations privées ===`);
          Array.from(convos.values()).forEach(convo => {
            const user1 = userStorage.getById(convo.user1);
            const user2 = userStorage.getById(convo.user2);
            addToHistory(`  ${user1?.pseudo || "?"} ↔ ${user2?.pseudo || "?"} (${convo.count} messages)`);
          });
        }
        break;

      case 'groups':
        const groups = groupStorage.getAll();
        if (groups.length === 0) {
          addToHistory("Aucun groupe");
        } else {
          addToHistory(`👥 ${groups.length} groupe(s):`);
          groups.forEach(g => {
            const creator = userStorage.getById(g.createdBy);
            const msgCount = messageStorage.getGroupMessages(g.id).length;
            addToHistory(`  - ${g.name}`);
            addToHistory(`    ID: ${g.id}`);
            addToHistory(`    Créateur: ${creator?.pseudo || "Inconnu"}`);
            addToHistory(`    Membres: ${g.members.length} | Messages: ${msgCount}`);
          });
        }
        break;

      case 'group':
        if (parts.length < 2) {
          addToHistory("❌ Usage: group <id>");
          break;
        }
        const groupId = parts[1];
        const group = groupStorage.getById(groupId);
        if (!group) {
          addToHistory(`❌ Groupe ${groupId} introuvable`);
        } else {
          const creator = userStorage.getById(group.createdBy);
          const messages = messageStorage.getGroupMessages(group.id);
          addToHistory(`=== Détails du groupe ===`);
          addToHistory(`ID: ${group.id}`);
          addToHistory(`Nom: ${group.name}`);
          addToHistory(`Créé par: ${creator?.pseudo || "Inconnu"}`);
          addToHistory(`Date: ${new Date(group.createdAt).toLocaleString()}`);
          if (group.description) addToHistory(`Description: ${group.description}`);
          addToHistory(`\nMembres (${group.members.length}):`);
          group.members.forEach(memberId => {
            const member = userStorage.getById(memberId);
            addToHistory(`  - ${member?.pseudo || "Inconnu"} (${memberId})`);
          });
          addToHistory(`\nMessages: ${messages.length}`);
        }
        break;

      case 'creategroup':
        if (parts.length < 3) {
          addToHistory("❌ Usage: creategroup <nom> <id_membre1> <id_membre2> ...");
          break;
        }
        const groupName = parts[1];
        const memberIds = parts.slice(2);
        const currentUser = currentUserStorage.get();
        if (!currentUser) {
          addToHistory("❌ Erreur: Utilisateur non connecté");
          break;
        }
        try {
          const newGroup = groupStorage.create({
            name: groupName,
            description: "",
            members: [currentUser.id, ...memberIds],
            createdBy: currentUser.id,
          });
          addToHistory(`✅ Groupe "${groupName}" créé`);
          addToHistory(`   ID: ${newGroup.id}`);
          addToHistory(`   Membres: ${newGroup.members.length}`);
          loadGroups();
          toast.success(`Groupe "${groupName}" créé`);
        } catch (error) {
          addToHistory("❌ Erreur lors de la création du groupe");
        }
        break;

      case 'delgroup':
        if (parts.length < 2) {
          addToHistory("❌ Usage: delgroup <id>");
          break;
        }
        const delGroupId = parts[1];
        const delGroup = groupStorage.getById(delGroupId);
        if (!delGroup) {
          addToHistory(`❌ Groupe ${delGroupId} introuvable`);
          break;
        }
        const success = groupStorage.delete(delGroupId);
        if (success) {
          addToHistory(`✅ Groupe "${delGroup.name}" supprimé`);
          loadGroups();
          toast.success(`Groupe supprimé`);
        } else {
          addToHistory(`❌ Erreur lors de la suppression`);
        }
        break;

      case 'posts':
        const posts = postStorage.getAll();
        addToHistory(`📝 Statistiques publications:`);
        addToHistory(`  Total: ${posts.length}`);
        addToHistory(`  Likes totaux: ${posts.reduce((sum, p) => sum + p.likes.length, 0)}`);
        addToHistory(`  Commentaires: ${posts.reduce((sum, p) => sum + p.comments.length, 0)}`);
        break;

      case 'stories':
        const stories = storyStorage.getAll();
        addToHistory(`📸 Statistiques stories:`);
        addToHistory(`  Total actif: ${stories.length}`);
        addToHistory(`  Vues totales: ${stories.reduce((sum, s) => sum + s.viewers.length, 0)}`);
        break;

      case 'search':
        if (parts.length < 2) {
          addToHistory("❌ Usage: search <terme>");
          break;
        }
        const searchTerm = parts.slice(1).join(' ');
        const results = userStorage.getAll().filter(u => 
          u.pseudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.bio?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        addToHistory(`🔍 ${results.length} résultat(s) pour '${searchTerm}':`);
        results.forEach(u => {
          addToHistory(`  - ${u.pseudo} (${u.role})`);
        });
        break;

      case 'clear':
        setHistory([
          "🔐 Terminal de gestion - Réseau Social",
          "Entrez 'help' pour voir les commandes disponibles",
          ""
        ]);
        return;

      case 'exit':
        navigate("/feed");
        return;

      default:
        addToHistory(`❌ Commande inconnue: '${action}'`);
        addToHistory("Tapez 'help' pour voir les commandes disponibles");
    }

    addToHistory("");
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    executeCommand(command);
    setCommand("");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 glass-effect border-primary/30">
          <div className="flex flex-col items-center gap-6">
            <div className="p-4 bg-gradient-to-br from-primary to-accent rounded-2xl glow-border">
              <Lock className="w-12 h-12 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2 glow-text">Terminal de Gestion</h1>
              <p className="text-muted-foreground text-sm">
                Accès restreint - Authentification requise
              </p>
            </div>
            <form onSubmit={handleAuth} className="w-full space-y-4">
              <Input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center tracking-widest"
                autoFocus
              />
              <Button type="submit" className="w-full" variant="gradient">
                Accéder au Terminal
              </Button>
            </form>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/feed")}
              className="text-xs"
            >
              Retour au Feed
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
      <Card className="max-w-5xl mx-auto glass-effect border-primary/30">
        <div className="p-4 border-b border-primary/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TerminalIcon className="w-5 h-5 text-primary" />
            <h1 className="font-bold glow-text">Terminal de Gestion</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/feed")}
            className="hover:bg-destructive/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div
          ref={historyRef}
          className="p-4 space-y-1 h-[60vh] overflow-y-auto font-mono text-sm bg-background/50"
        >
          {history.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {line}
            </div>
          ))}
        </div>

        <form onSubmit={handleCommandSubmit} className="p-4 border-t border-primary/30 flex gap-2">
          <span className="text-primary font-mono">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="flex-1 bg-transparent outline-none font-mono"
            placeholder="Entrez une commande..."
            autoComplete="off"
          />
        </form>
      </Card>
    </div>
  );
};

export default Terminal;
