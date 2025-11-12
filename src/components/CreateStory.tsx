import { useState } from "react";
import { X, Image, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface CreateStoryProps {
  onClose: () => void;
  onSubmit: (content: string, type: "text" | "image") => void;
}

const CreateStory = ({ onClose, onSubmit }: CreateStoryProps) => {
  const [storyType, setStoryType] = useState<"text" | "image" | null>(null);
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error("Ajoute du contenu à ta story !");
      return;
    }
    onSubmit(content, storyType || "text");
    toast.success("Story publiée ! 🎉");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-lg glass-effect border-primary/30 p-6 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold glow-text">Créer une story</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-destructive/20 hover:text-destructive"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {!storyType ? (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setStoryType("text")}
              className="p-8 glass-effect border-2 border-border/50 hover:border-primary rounded-lg transition-all group"
            >
              <Type className="w-12 h-12 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
              <p className="text-foreground font-semibold">Texte</p>
            </button>
            <button
              onClick={() => setStoryType("image")}
              className="p-8 glass-effect border-2 border-border/50 hover:border-accent rounded-lg transition-all group"
            >
              <Image className="w-12 h-12 mx-auto mb-3 text-accent group-hover:scale-110 transition-transform" />
              <p className="text-foreground font-semibold">Image</p>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {storyType === "text" ? (
              <>
                <Textarea
                  placeholder="Écris ton message..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="bg-secondary/50 border-border/50 min-h-[200px] text-lg focus:border-primary"
                  maxLength={280}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {content.length}/280
                </p>
              </>
            ) : (
              <div className="border-2 border-dashed border-border/50 rounded-lg p-12 text-center">
                <Image className="w-16 h-16 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Fonctionnalité bientôt disponible</p>
                <p className="text-xs text-muted-foreground mt-2">Upload d'images à venir</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStoryType(null)}
                className="flex-1 border-border/50"
              >
                Retour
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || (storyType === "image" && !content)}
                className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
              >
                Publier
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CreateStory;
