import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Send, Home, User, MessageSquare, LogOut, Calendar as CalendarIcon, Trash2, Shield, Plus } from "lucide-react";
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
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Réseau Potes
          </h1>
          <div className="flex items-center gap-2">
            {user && isAdmin(user.id) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin")}
                className="hover:bg-secondary"
                title="Administration"
              >
                <Shield className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hover:bg-destructive/10 hover:text-destructive"
              title="Déconnexion"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t shadow-lg z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <NavLink
              to="/feed"
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors hover:bg-secondary"
              activeClassName="text-primary bg-secondary"
            >
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium">Accueil</span>
            </NavLink>
            <NavLink
              to="/messages"
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors hover:bg-secondary relative"
              activeClassName="text-primary bg-secondary"
            >
              <MessageSquare className="w-6 h-6" />
              <span className="text-xs font-medium">Messages</span>
              {unreadMessages > 0 && (
                <span className="absolute top-0 right-2 bg-destructive text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center shadow-md">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </NavLink>
            <NavLink
              to="/calendar"
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors hover:bg-secondary"
              activeClassName="text-primary bg-secondary"
            >
              <CalendarIcon className="w-6 h-6" />
              <span className="text-xs font-medium">Agenda</span>
            </NavLink>
            <NavLink
              to="/profile"
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors hover:bg-secondary"
              activeClassName="text-primary bg-secondary"
            >
              <User className="w-6 h-6" />
              <span className="text-xs font-medium">Profil</span>
            </NavLink>
          </div>
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
    </div>
  );
};

export default Feed;
