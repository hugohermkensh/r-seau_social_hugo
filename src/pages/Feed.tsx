import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Send, Home, User, MessageSquare, LogOut, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ZodError } from "zod";
import StoryCircle from "@/components/StoryCircle";
import StoryViewer from "@/components/StoryViewer";
import CreateStory from "@/components/CreateStory";
import { currentUserStorage, postStorage, storyStorage, userStorage, messageStorage } from "@/lib/storage";
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

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    loadPosts();
    loadStories();
    loadUnreadMessages();
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
    toast.success("À bientôt !");
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-primary/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold glow-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Réseau Potes
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hover:bg-destructive/20 hover:text-destructive transition-all"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Stories Section */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-4 pb-2">
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
        <Card className="glass-effect border-primary/30 p-4 mb-6 animate-slide-up">
          <div className="flex gap-3">
            <Avatar className="border-2 border-primary/50">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold">
                {getInitials(user.pseudo)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Quoi de neuf ?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="bg-secondary/50 border-border/50 resize-none focus:border-primary transition-all"
                rows={3}
                maxLength={1000}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{newPost.length}/1000</span>
                <Button 
                  onClick={handlePost}
                  disabled={!newPost.trim()}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all glow-border text-primary-foreground"
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
            <Card className="glass-effect border-primary/30 p-8 text-center">
              <p className="text-muted-foreground">Aucune publication pour le moment</p>
              <p className="text-xs text-muted-foreground mt-2">Sois le premier à poster !</p>
            </Card>
          ) : (
            posts.map((post, index) => (
              <Card 
                key={post.id} 
                className="glass-effect border-primary/30 p-4 hover:border-primary/50 transition-all animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="border-2 border-primary/50">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold">
                      {getInitials(post.author)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{post.author}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(post.timestamp)}
                        </span>
                        {post.authorId === user.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePost(post.id, post.authorId)}
                            className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-foreground mb-4 ml-12 whitespace-pre-wrap">{post.content}</p>

                {/* Actions */}
                <div className="flex items-center gap-6 ml-12 text-muted-foreground mb-3">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 transition-colors group ${
                      post.likes.includes(user.id) ? "text-primary" : "hover:text-primary"
                    }`}
                  >
                    <Heart 
                      className={`w-5 h-5 transition-all ${
                        post.likes.includes(user.id) ? "fill-primary" : "group-hover:fill-primary"
                      }`}
                    />
                    <span className="text-sm">{post.likes.length}</span>
                  </button>
                  <button 
                    onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)}
                    className="flex items-center gap-2 hover:text-accent transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{post.comments.length}</span>
                  </button>
                </div>

                {/* Comments */}
                {post.comments.length > 0 && (
                  <div className="ml-12 space-y-2 mb-3 pt-3 border-t border-border/50">
                    {post.comments.map((comment: any) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar className="w-6 h-6 border border-primary/50">
                          <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">
                            {getInitials(comment.author)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-secondary/50 rounded-lg px-3 py-1.5">
                            <p className="text-xs font-semibold text-foreground mb-0.5">
                              {comment.author}
                            </p>
                            <p className="text-sm text-foreground">{comment.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 ml-3">
                            {formatTimestamp(comment.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment Input */}
                {commentingPostId === post.id && (
                  <div className="ml-12 flex gap-2 pt-3 border-t border-border/50">
                    <Input
                      placeholder="Écris un commentaire..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleComment(post.id)}
                      className="bg-secondary/50 border-border/50"
                      maxLength={500}
                    />
                    <Button
                      onClick={() => handleComment(post.id)}
                      disabled={!commentText.trim()}
                      size="icon"
                      className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-effect border-t border-primary/30 backdrop-blur-xl z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/feed")}
              className="hover:bg-primary/20 hover:text-primary transition-all text-primary"
            >
              <Home className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/messages")}
              className="hover:bg-primary/20 hover:text-primary transition-all relative"
            >
              <MessageSquare className="w-6 h-6" />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/calendar")}
              className="hover:bg-primary/20 hover:text-primary transition-all"
            >
              <CalendarIcon className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
              className="hover:bg-primary/20 hover:text-primary transition-all"
            >
              <User className="w-6 h-6" />
            </Button>
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
  );
};

export default Feed;
