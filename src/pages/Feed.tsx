import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Send, Trash2, Plus, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ZodError } from "zod";
import StoryCircle from "@/components/StoryCircle";
import StoryViewer from "@/components/StoryViewer";
import CreateStory from "@/components/CreateStory";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { AppLayout } from "@/components/AppLayout";
import { currentUserStorage, postStorage, storyStorage, userStorage } from "@/lib/storage";
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

    toast.success("Story publiée !");
    loadStories();
  };

  if (!user) return null;

  return (
    <AppLayout>
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
          <Card className="glass-effect border-primary/20 p-5 mb-6 animate-slide-up hover:border-primary/40 transition-all">
            <div className="flex gap-4">
              <Avatar className="border-2 border-primary/30 shadow-md">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                  {getInitials(user.pseudo)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Quoi de neuf ?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="bg-secondary/30 border-border/50 resize-none focus:border-primary transition-colors min-h-[100px]"
                  maxLength={1000}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">{newPost.length}/1000</span>
                  <Button 
                    onClick={handlePost}
                    disabled={!newPost.trim()}
                    variant="gradient"
                    size="sm"
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
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
                  className="glass-effect border-primary/10 p-5 hover:border-primary/30 transition-all animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="border-2 border-border/50 shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                        {getInitials(post.author)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-foreground truncate">{post.author}</h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(post.timestamp)}
                          </span>
                          {post.authorId === user.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePost(post.id, post.authorId)}
                              className="h-7 w-7 hover:bg-destructive/20 hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-foreground mb-4 whitespace-pre-wrap leading-relaxed pl-14">{post.content}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pl-14 pt-3 border-t border-border/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={`gap-2 transition-all ${
                        post.likes.includes(user.id)
                          ? "text-accent hover:text-accent"
                          : "text-muted-foreground hover:text-accent"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 transition-all ${
                          post.likes.includes(user.id) ? "fill-accent scale-110" : ""
                        }`}
                      />
                      <span className="font-medium">{post.likes.length}</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCommentingPostId(
                        commentingPostId === post.id ? null : post.id
                      )}
                      className="gap-2 text-muted-foreground hover:text-primary"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="font-medium">{post.comments.length}</span>
                    </Button>
                  </div>

                  {/* Comments */}
                  {post.comments.length > 0 && (
                    <div className="mt-4 pl-14 space-y-3">
                      {post.comments.slice(-3).map((comment: any) => (
                        <div key={comment.id} className="p-3 rounded-lg bg-secondary/30">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment Form */}
                  {commentingPostId === post.id && (
                    <div className="mt-4 pl-14 flex gap-2 animate-fade-in">
                      <Input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Ajouter un commentaire..."
                        className="bg-secondary/30 border-border/50 flex-1"
                        maxLength={500}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && commentText.trim()) {
                            handleComment(post.id);
                          }
                        }}
                      />
                      <Button
                        onClick={() => handleComment(post.id)}
                        disabled={!commentText.trim()}
                        variant="gradient"
                        size="icon"
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
      )}

      {/* Story Viewer Modal */}
      {selectedStory && (
        <StoryViewer
          stories={selectedStory.stories}
          currentIndex={selectedStory.index}
          onClose={() => {
            setSelectedStory(null);
            loadStories();
          }}
          onNext={handleStoryNext}
        />
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <CreateStory
          onClose={() => setShowCreateStory(false)}
          onSubmit={handleCreateStory}
        />
      )}
    </AppLayout>
  );
};

export default Feed;
