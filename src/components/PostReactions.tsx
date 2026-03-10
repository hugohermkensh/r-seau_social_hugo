import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SmilePlus } from "lucide-react";
import { getFromStorage, saveToStorage } from "@/lib/storage";

const REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍", "👎", "🔥", "🎉", "💯"];
const REACTIONS_KEY = "reseau_potes_reactions";

interface Reaction {
  postId: string;
  userId: string;
  emoji: string;
}

export const reactionStorage = {
  getForPost: (postId: string): Reaction[] => {
    return getFromStorage<Reaction>(REACTIONS_KEY).filter(r => r.postId === postId);
  },

  toggle: (postId: string, userId: string, emoji: string): void => {
    const reactions = getFromStorage<Reaction>(REACTIONS_KEY);
    const existingIndex = reactions.findIndex(
      r => r.postId === postId && r.userId === userId && r.emoji === emoji
    );

    if (existingIndex >= 0) {
      reactions.splice(existingIndex, 1);
    } else {
      // Remove other reactions from same user on same post
      const filtered = reactions.filter(
        r => !(r.postId === postId && r.userId === userId)
      );
      filtered.push({ postId, userId, emoji });
      saveToStorage(REACTIONS_KEY, filtered);
      return;
    }
    saveToStorage(REACTIONS_KEY, reactions);
  },
};

interface PostReactionsProps {
  postId: string;
  userId: string;
}

export const PostReactions = ({ postId, userId }: PostReactionsProps) => {
  const [reactions, setReactions] = useState(reactionStorage.getForPost(postId));
  const [open, setOpen] = useState(false);

  const handleReact = (emoji: string) => {
    reactionStorage.toggle(postId, userId, emoji);
    setReactions(reactionStorage.getForPost(postId));
    setOpen(false);
  };

  // Group reactions by emoji
  const grouped = reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  const userReaction = reactions.find(r => r.userId === userId)?.emoji;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Object.entries(grouped).map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => handleReact(emoji)}
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-all ${
            userReaction === emoji
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
        >
          <span>{emoji}</span>
          <span className="text-muted-foreground">{count}</span>
        </button>
      ))}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
            <SmilePlus className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top">
          <div className="flex gap-1">
            {REACTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="text-lg hover:scale-125 transition-transform p-1 rounded hover:bg-muted"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
