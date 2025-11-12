import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface StoryCircleProps {
  userName: string;
  hasNewStory: boolean;
  isOwn?: boolean;
  onClick: () => void;
}

const StoryCircle = ({ userName, hasNewStory, isOwn, onClick }: StoryCircleProps) => {
  return (
    <div 
      onClick={onClick}
      className="flex flex-col items-center gap-1 cursor-pointer group"
    >
      <div className={`relative ${hasNewStory ? 'p-0.5 bg-gradient-to-br from-primary via-accent to-primary rounded-full animate-pulse-glow' : ''}`}>
        <Avatar className={`w-16 h-16 border-2 ${hasNewStory ? 'border-background' : 'border-border'} group-hover:scale-110 transition-transform`}>
          <AvatarFallback className={`${isOwn ? 'bg-gradient-to-br from-primary to-accent' : 'bg-secondary'} text-foreground font-bold text-lg`}>
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {isOwn && (
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-gradient-to-br from-primary to-accent rounded-full border-2 border-background flex items-center justify-center">
            <span className="text-xs text-primary-foreground font-bold">+</span>
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground max-w-[64px] truncate">
        {isOwn ? "Toi" : userName}
      </span>
    </div>
  );
};

export default StoryCircle;
