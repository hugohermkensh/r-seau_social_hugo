import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit2, Save, Heart, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { currentUserStorage, userStorage, postStorage } from "@/lib/storage";
import { profileUpdateSchema } from "@/lib/validators";
import { formatTimestamp, getInitials } from "@/lib/utils";
import { ZodError } from "zod";
import { AppLayout } from "@/components/AppLayout";

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

  if (!user) return null;

  const totalLikes = userPosts.reduce((sum, post) => sum + post.likes.length, 0);

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 glass-effect border-b border-primary/30 backdrop-blur-xl lg:relative">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-xl font-bold glow-text">Profil</h1>
          </div>
        </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Profile Card */}
        <Card className="glass-effect border-primary/30 p-6 mb-6 animate-slide-up">
          <div className="flex items-start gap-4 mb-6">
            <Avatar className="w-24 h-24 border-4 border-primary/50">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-3xl font-bold">
                {getInitials(user.pseudo)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
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
                  <h2 className="text-2xl font-bold glow-text mb-2">{user.pseudo}</h2>
                  <p className="text-muted-foreground mb-4">
                    {user.bio || "Aucune bio pour le moment"}
                  </p>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
              className="border-primary/50 hover:bg-primary/20"
            >
              {isEditing ? <Save className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{userPosts.length}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{totalLikes}</p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {userPosts.reduce((sum, p) => sum + p.comments.length, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Commentaires</p>
            </div>
          </div>
        </Card>

        {/* User Posts */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Tes publications</h3>
          {userPosts.length === 0 ? (
            <Card className="glass-effect border-primary/30 p-8 text-center">
              <p className="text-muted-foreground">Aucune publication pour le moment</p>
            </Card>
          ) : (
            userPosts.map((post) => (
              <Card
                key={post.id}
                className="glass-effect border-primary/30 p-4 hover:border-primary/50 transition-all"
              >
                <p className="text-foreground mb-3">{post.content}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{post.likes.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments.length}</span>
                  </div>
                  <span className="ml-auto">{formatTimestamp(post.timestamp)}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
    </AppLayout>
  );
};

export default Profile;
