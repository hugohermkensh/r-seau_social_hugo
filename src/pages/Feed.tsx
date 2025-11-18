import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Send, Home, User, MessageSquare, LogOut, Calendar as CalendarIcon, Trash2, Shield, Plus, Terminal as TerminalIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ZodError } from "zod";
import StoryCircle from "@/components/StoryCircle";
import StoryViewer from "@/components/StoryViewer";
import CreateStory from "@/components/CreateStory";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { NavLink } from "@/components/NavLink";
import { currentUserStorage, postStorage, storyStorage, userStorage, messageStorage } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import { postCreateSchema, commentCreateSchema } from "@/lib/validators";
import { formatTimestamp, getInitials } from "@/lib/utils";

const Feed = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(currentUserStorage.get());
  const [posts, setPosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [selectedStory, setSelectedStory] = useState<{ stories: any[], index: number } | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        loadPosts(),
        loadStories(),
        loadUnreadMessages()
      ]);
      setIsLoading(false);
    };

    loadData();
  }, [user, navigate]);

  const loadPosts = () => {
    const allPosts = postStorage.getAll();
    setPosts(allPosts);
  };

  const loadStories = () => {
    const allStories = storyStorage.getAll();
    
    // Group stories by author
    const storyMap = new Map<string, any[]>();
    allStories.forEach(story => {
      const author = userStorage.getById(story.authorId);
      if (author) {
        const existing = storyMap.get(author.id) || [];
        existing.push(story);
        storyMap.set(author.id, existing);
      }
    });

    const grouped = Array.from(storyMap.entries()).map(([authorId, userStories]) => {
      const author = userStorage.getById(authorId);
      const hasNew = userStories.some(s => !s.viewers.includes(user!.id));
      return {
        userName: author?.pseudo || "Inconnu",
        authorId,
        hasNewStory: hasNew,
        stories: userStories.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
      };
    });

    setStories(grouped);
  };

  const loadUnreadMessages = () => {
    const count = messageStorage.getUnreadCount(user!.id);
    setUnreadMessages(count);
  };

  const handlePost = () => {
    if (!user) return;

    try {
      const validated = postCreateSchema.parse({ content: newPost });

      postStorage.create({
        authorId: user.id,
        author: user.pseudo,
        content: validated.content,
        type: "text",
      });

      setNewPost("");
      toast.success("Post publié !");
      loadPosts();
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.issues[0].message);
      }
    }
  };

  const handleLike = (postId: string) => {
    if (!user) return;
    postStorage.toggleLike(postId, user.id);
    loadPosts();
  };

  const handleComment = (postId: string) => {
    if (!user || !commentText.trim()) return;

    try {
      const validated = commentCreateSchema.parse({ content: commentText });

      postStorage.addComment(postId, {
        id: `comment_${Date.now()}`,
        authorId: user.id,
        author: user.pseudo,
        content: validated.content,
        timestamp: new Date().toISOString(),
      });

      setCommentText("");
      setCommentingPostId(null);
      toast.success("Commentaire ajouté !");
      loadPosts();
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.issues[0].message);
      }
    }
  };

  const handleDeletePost = (postId: string, authorId: string) => {
    if (!user || user.id !== authorId) {
      toast.error("Tu ne peux supprimer que tes propres posts");
      return;
    }
    
    postStorage.delete(postId);
    loadPosts();
    toast.success("Post supprimé");
  };

  const handleStoryClick = (authorId: string) => {
    const userStory = stories.find(s => s.authorId === authorId);
    if (userStory && userStory.stories.length > 0) {
      setSelectedStory({ stories: userStory.stories, index: 0 });
      // Mark first story as viewed
      storyStorage.addViewer(userStory.stories[0].id, user!.id);
    }
  };

  const handleStoryNext = () => {
    if (!selectedStory || !user) return;
    const newIndex = selectedStory.index + 1;
    
    if (newIndex < selectedStory.stories.length) {
      setSelectedStory({ ...selectedStory, index: newIndex });
      storyStorage.addViewer(selectedStory.stories[newIndex].id, user.id);
    } else {
      setSelectedStory(null);
      loadStories();
    }
  };

  const handleCreateStory = (content: string, type: "text" | "image") => {
    if (!user) return;

    storyStorage.create({
      authorId: user.id,
      author: user.pseudo,
      content,
      type,
    });

    toast.success("Story publiée ! 🎉");
    loadStories();
  };

  const handleLogout = () => {
    currentUserStorage.clear();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-64 xl:w-72 bg-card/50 backdrop-blur-xl border-r border-border/50 z-40">
        {/* Logo / Brand */}
        <div className="p-6 border-b border-border/30">
          <h1 className="text-2xl font-bold glow-text flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Home className="w-5 h-5 text-white" />
            </div>
            Réseau Potes
          </h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/feed"
            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
            activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
          >
            <Home className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="font-medium">Accueil</span>
          </NavLink>
          
          <NavLink
            to="/messages"
            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
            activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5 transition-transform group-hover:scale-110" />
              {unreadMessages > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center animate-pulse">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </div>
            <span className="font-medium">Messages</span>
            {unreadMessages > 0 && (
              <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-1 rounded-full font-semibold">
                {unreadMessages}
              </span>
            )}
          </NavLink>
          
          <NavLink
            to="/calendar"
            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
            activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
          >
            <CalendarIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="font-medium">Agenda</span>
          </NavLink>
          
          <NavLink
            to="/profile"
            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
            activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
          >
            <User className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="font-medium">Profil</span>
          </NavLink>

          {user && isAdmin(user.id) && (
            <>
              <div className="h-px bg-border/50 my-4"></div>
              <NavLink
                to="/admin"
                className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
                activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
              >
                <Shield className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="font-medium">Admin</span>
              </NavLink>
              
              <NavLink
                to="/terminal"
                className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
                activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
              >
                <TerminalIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="font-medium">Terminal</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* User Profile + Logout */}
        <div className="p-4 border-t border-border/30">
          <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-secondary/30">
            <Avatar className="border-2 border-primary/50 shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold text-sm">
                {getInitials(user.pseudo)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user.pseudo}</p>
              <p className="text-xs text-muted-foreground">En ligne</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-destructive/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Mobile Header - Only visible on mobile */}
      <header className="lg:hidden sticky top-0 z-50 w-full bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold glow-text">
            Réseau Potes
          </h1>
          <div className="flex items-center gap-2">
            {user && isAdmin(user.id) && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/admin")}
                  className="hover:bg-secondary"
                >
                  <Shield className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/terminal")}
                  className="hover:bg-secondary"
                >
                  <TerminalIcon className="h-5 w-5" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 xl:ml-72 pb-20 lg:pb-6">

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Stories Section */}
        <div className="mb-6 overflow-x-auto hide-scrollbar">
          <div className="flex gap-4 pb-2 animate-fade-in">
            <StoryCircle
              userName={user.pseudo}
              hasNewStory={false}
              isOwn={true}
              onClick={() => setShowCreateStory(true)}
            />
            {stories.map((story) => (
              <StoryCircle
                key={story.authorId}
                userName={story.userName}
                hasNewStory={story.hasNewStory}
                onClick={() => handleStoryClick(story.authorId)}
              />
            ))}
          </div>
        </div>

        {/* Create Post Card */}
        <Card className="bg-card border shadow-sm p-4 mb-6 animate-slide-up hover:shadow-md transition-shadow">
          <div className="flex gap-3">
            <Avatar className="border-2 border-border">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                {getInitials(user.pseudo)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Quoi de neuf ?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="bg-background border-input resize-none focus:border-primary transition-colors min-h-[80px]"
                maxLength={1000}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">{newPost.length}/1000</span>
                <Button 
                  onClick={handlePost}
                  disabled={!newPost.trim()}
                  variant="gradient"
                  size="sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Publier
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="Aucune publication"
              description="Sois le premier à partager quelque chose avec tes amis !"
              action={{
                label: "Créer un post",
                onClick: () => document.querySelector('textarea')?.focus()
              }}
            />
          ) : (
            posts.map((post, index) => (
              <Card 
                key={post.id} 
                className="bg-card border shadow-sm p-4 hover:shadow-md transition-all animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="border-2 border-border">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                      {getInitials(post.author)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{post.author}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          {formatTimestamp(post.timestamp)}
                        </span>
                        {post.authorId === user.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePost(post.id, post.authorId)}
                            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-foreground mb-4 ml-12 whitespace-pre-wrap leading-relaxed">{post.content}</p>

                {/* Actions */}
                <div className="flex items-center gap-6 ml-12 text-muted-foreground mb-3">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 transition-all group ${
                      post.likes.includes(user.id) ? "text-primary" : "hover:text-primary"
                    }`}
                  >
                    <Heart 
                      className={`w-5 h-5 transition-all ${
                        post.likes.includes(user.id) ? "fill-primary scale-110" : "group-hover:scale-110"
                      }`}
                    />
                    <span className="text-sm font-medium">{post.likes.length}</span>
                  </button>
                  <button 
                    onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)}
                    className="flex items-center gap-2 hover:text-primary transition-all group"
                  >
                    <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">{post.comments.length}</span>
                  </button>
                </div>

                {/* Comments */}
                {post.comments.length > 0 && (
                  <div className="ml-12 space-y-2 mb-3 pt-3 border-t">
                    {post.comments.map((comment: any) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar className="w-7 h-7 border border-border">
                          <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">
                            {getInitials(comment.author)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-secondary rounded-2xl px-3 py-2">
                            <p className="text-xs font-semibold text-foreground mb-0.5">
                              {comment.author}
                            </p>
                            <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 ml-3 font-medium">
                            {formatTimestamp(comment.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment Input */}
                {commentingPostId === post.id && (
                  <div className="ml-12 flex gap-2 pt-3 border-t">
                    <Input
                      placeholder="Écris un commentaire..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleComment(post.id)}
                      className="bg-background border-input rounded-full"
                      maxLength={500}
                    />
                    <Button
                      onClick={() => handleComment(post.id)}
                      disabled={!commentText.trim()}
                      size="icon"
                      variant="gradient"
                      className="rounded-full"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Bottom Navigation - Mobile only */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-border/30 shadow-xl">
          <div className="flex items-center justify-around px-2 py-2">
            <NavLink
              to="/feed"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-secondary/30 flex-1"
              activeClassName="text-primary scale-105"
            >
              <div className="relative">
                <Home className="w-6 h-6 transition-transform" />
              </div>
              <span className="text-[10px] font-semibold">Accueil</span>
            </NavLink>
            
            <NavLink
              to="/messages"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-secondary/30 flex-1 relative"
              activeClassName="text-primary scale-105"
            >
              <div className="relative">
                <MessageSquare className="w-6 h-6 transition-transform" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-br from-accent to-destructive text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center shadow-neon animate-pulse">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold">Messages</span>
            </NavLink>
            
            <NavLink
              to="/calendar"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-secondary/30 flex-1"
              activeClassName="text-primary scale-105"
            >
              <div className="relative">
                <CalendarIcon className="w-6 h-6 transition-transform" />
              </div>
              <span className="text-[10px] font-semibold">Agenda</span>
            </NavLink>
            
            <NavLink
              to="/profile"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-secondary/30 flex-1"
              activeClassName="text-primary scale-105"
            >
              <div className="relative">
                <User className="w-6 h-6 transition-transform" />
              </div>
              <span className="text-[10px] font-semibold">Profil</span>
            </NavLink>
          </div>
        </nav>

      {/* Story Viewer */}
      {selectedStory && (
        <StoryViewer
          stories={selectedStory.stories}
          currentIndex={selectedStory.index}
          onClose={() => {
            setSelectedStory(null);
            loadStories();
          }}
          onNext={handleStoryNext}
          onPrevious={() => {
            if (selectedStory.index > 0) {
              setSelectedStory({ ...selectedStory, index: selectedStory.index - 1 });
            }
          }}
        />
      )}

      {/* Create Story */}
      {showCreateStory && (
        <CreateStory
          onClose={() => setShowCreateStory(false)}
          onSubmit={handleCreateStory}
        />
      )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Feed;
