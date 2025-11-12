import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Send, Home, User, MessageSquare, LogOut } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import StoryCircle from "@/components/StoryCircle";
import StoryViewer from "@/components/StoryViewer";
import CreateStory from "@/components/CreateStory";

interface Post {
  id: number;
  author: string;
  content: string;
  likes: number;
  comments: number;
  timestamp: string;
}

interface Story {
  id: number;
  author: string;
  content: string;
  timestamp: string;
  type: "text" | "image";
}

interface UserStories {
  userName: string;
  hasNewStory: boolean;
  stories: Story[];
}

const Feed = () => {
  const navigate = useNavigate();
  const [posts] = useState<Post[]>([
    {
      id: 1,
      author: "Alex",
      content: "Premier post sur notre réseau privé ! 🚀",
      likes: 5,
      comments: 2,
      timestamp: "Il y a 5 min",
    },
    {
      id: 2,
      author: "Sarah",
      content: "Trop cool ce design futuriste ! 💙",
      likes: 8,
      comments: 3,
      timestamp: "Il y a 15 min",
    },
  ]);

  const [userStories] = useState<UserStories[]>([
    {
      userName: "Alex",
      hasNewStory: true,
      stories: [
        { id: 1, author: "Alex", content: "Première story ! 🔥", timestamp: "Il y a 2h", type: "text" },
        { id: 2, author: "Alex", content: "Trop cool ce réseau privé", timestamp: "Il y a 1h", type: "text" },
      ],
    },
    {
      userName: "Sarah",
      hasNewStory: true,
      stories: [
        { id: 3, author: "Sarah", content: "Journée incroyable ! 🌟", timestamp: "Il y a 3h", type: "text" },
      ],
    },
    {
      userName: "Tom",
      hasNewStory: false,
      stories: [],
    },
  ]);

  const [newPost, setNewPost] = useState("");
  const [selectedStory, setSelectedStory] = useState<{ stories: Story[], index: number } | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handlePost = () => {
    if (!newPost.trim()) {
      toast.error("Écris quelque chose !");
      return;
    }
    toast.success("Post publié !");
    setNewPost("");
  };

  const handleStoryClick = (userName: string) => {
    const userStory = userStories.find(s => s.userName === userName);
    if (userStory && userStory.stories.length > 0) {
      setSelectedStory({ stories: userStory.stories, index: 0 });
    }
  };

  const handleCreateStory = (content: string, type: "text" | "image") => {
    console.log("Story created:", content, type);
    // Ici on ajouterait la logique pour sauvegarder la story
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast.success("À bientôt !");
    navigate("/");
  };

  if (!user.pseudo) {
    navigate("/");
    return null;
  }

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
              userName={user.pseudo || "Toi"}
              hasNewStory={false}
              isOwn={true}
              onClick={() => setShowCreateStory(true)}
            />
            {userStories.map((story) => (
              <StoryCircle
                key={story.userName}
                userName={story.userName}
                hasNewStory={story.hasNewStory}
                onClick={() => handleStoryClick(story.userName)}
              />
            ))}
          </div>
        </div>

        {/* Create Post Card */}
        <Card className="glass-effect border-primary/30 p-4 mb-6 animate-slide-up">
          <div className="flex gap-3">
            <Avatar className="border-2 border-primary/50">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold">
                {user.pseudo?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Quoi de neuf ?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="bg-secondary/50 border-border/50 resize-none focus:border-primary transition-all"
                rows={3}
              />
              <Button 
                onClick={handlePost}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all glow-border text-primary-foreground"
              >
                <Send className="w-4 h-4 mr-2" />
                Publier
              </Button>
            </div>
          </div>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.map((post, index) => (
            <Card 
              key={post.id} 
              className="glass-effect border-primary/30 p-4 hover:border-primary/50 transition-all animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="border-2 border-primary/50">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold">
                    {post.author.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{post.author}</h3>
                    <span className="text-xs text-muted-foreground">{post.timestamp}</span>
                  </div>
                </div>
              </div>

              <p className="text-foreground mb-4 ml-12">{post.content}</p>

              <div className="flex items-center gap-6 ml-12 text-muted-foreground">
                <button className="flex items-center gap-2 hover:text-primary transition-colors group">
                  <Heart className="w-5 h-5 group-hover:fill-primary transition-all" />
                  <span className="text-sm">{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 hover:text-accent transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">{post.comments}</span>
                </button>
                <button className="flex items-center gap-2 hover:text-accent transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-effect border-t border-primary/30 backdrop-blur-xl z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/20 hover:text-primary transition-all"
            >
              <Home className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-primary/20 hover:text-primary transition-all"
            >
              <MessageSquare className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
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
          onClose={() => setSelectedStory(null)}
          onNext={() => setSelectedStory(prev => prev ? { ...prev, index: prev.index + 1 } : null)}
          onPrevious={() => setSelectedStory(prev => prev ? { ...prev, index: prev.index - 1 } : null)}
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
