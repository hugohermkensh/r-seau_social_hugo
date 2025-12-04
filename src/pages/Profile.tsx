import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit2, Save, Heart, MessageSquare, User, Sparkles, Calendar, X } from "lucide-react";
import { toast } from "sonner";
import { currentUserStorage, userStorage, postStorage } from "@/lib/storage";
import { profileUpdateSchema } from "@/lib/validators";
import { formatTimestamp, getInitials } from "@/lib/utils";
import { ZodError } from "zod";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(currentUserStorage.get());
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editPseudo, setEditPseudo] = useState(user?.pseudo || "");
  const [editBio, setEditBio] = useState(user?.bio || "");

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    
    const posts = postStorage.getByAuthor(user.id);
    setUserPosts(posts);
  }, [user, navigate]);

  const handleSave = () => {
    if (!user) return;

    try {
      const validated = profileUpdateSchema.parse({
        pseudo: editPseudo,
        bio: editBio,
      });

      const updated = userStorage.update(user.id, validated);
      if (updated) {
        setUser(updated);
        currentUserStorage.set(updated);
        setIsEditing(false);
        toast.success("Profil mis à jour !");
      }
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.issues[0].message);
      }
    }
  };

  const handleCancel = () => {
    setEditPseudo(user?.pseudo || "");
    setEditBio(user?.bio || "");
    setIsEditing(false);
  };

  if (!user) return null;

  const totalLikes = userPosts.reduce((sum, post) => sum + post.likes.length, 0);
  const totalComments = userPosts.reduce((sum, p) => sum + p.comments.length, 0);

  return (
    <AppLayout>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Profile Header Card */}
          <Card className="glass-effect border-primary/20 overflow-hidden mb-6 animate-slide-up">
            {/* Banner */}
            <div className="h-32 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,255,255,0.1),transparent)]" />
            </div>
            
            {/* Profile Info */}
            <div className="px-6 pb-6">
              <div className="flex items-end gap-4 -mt-12 mb-4">
                <Avatar className="w-24 h-24 border-4 border-card shadow-xl">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-3xl font-bold">
                    {getInitials(user.pseudo)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {user.role === "admin" && (
                      <Badge className="bg-accent/20 text-accent border-accent/30">
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 pb-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancel}
                        className="hover:bg-destructive/20 hover:text-destructive"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="gradient"
                        size="icon"
                        onClick={handleSave}
                      >
                        <Save className="w-5 h-5" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="border-primary/30 hover:bg-primary/20 gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </Button>
                  )}
                </div>
              </div>

              {/* Edit Mode or Display Mode */}
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Pseudo</Label>
                    <Input
                      value={editPseudo}
                      onChange={(e) => setEditPseudo(e.target.value)}
                      className="bg-secondary/50 border-border/50 mt-1"
                      maxLength={20}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Bio</Label>
                    <Textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Parle-nous de toi..."
                      className="bg-secondary/50 border-border/50 resize-none mt-1"
                      rows={3}
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground text-right mt-1">
                      {editBio.length}/200
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold glow-text mb-2">{user.pseudo}</h1>
                  <p className="text-muted-foreground mb-4">
                    {user.bio || "Aucune bio pour le moment"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="glass-effect border-primary/20 p-4 text-center hover:border-primary/40 transition-all">
              <div className="p-2 bg-primary/20 rounded-lg w-fit mx-auto mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary">{userPosts.length}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </Card>
            
            <Card className="glass-effect border-accent/20 p-4 text-center hover:border-accent/40 transition-all">
              <div className="p-2 bg-accent/20 rounded-lg w-fit mx-auto mb-2">
                <Heart className="w-5 h-5 text-accent" />
              </div>
              <p className="text-2xl font-bold text-accent">{totalLikes}</p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </Card>
            
            <Card className="glass-effect border-primary/20 p-4 text-center hover:border-primary/40 transition-all">
              <div className="p-2 bg-primary/20 rounded-lg w-fit mx-auto mb-2">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-primary">{totalComments}</p>
              <p className="text-xs text-muted-foreground">Commentaires</p>
            </Card>
          </div>

          {/* User Posts */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Tes publications
            </h3>
            
            {userPosts.length === 0 ? (
              <Card className="glass-effect border-primary/20 p-8 text-center">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground font-medium">Aucune publication</p>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  Partage quelque chose avec tes amis !
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {userPosts.map((post, index) => (
                  <Card
                    key={post.id}
                    className="glass-effect border-primary/10 p-4 hover:border-primary/30 transition-all animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t border-border/30">
                      <div className="flex items-center gap-1.5">
                        <Heart className={`w-4 h-4 ${post.likes.length > 0 ? "text-accent fill-accent" : ""}`} />
                        <span>{post.likes.length}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments.length}</span>
                      </div>
                      <span className="ml-auto text-xs">{formatTimestamp(post.timestamp)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
