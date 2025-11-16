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
      className="flex flex-col items-center gap-2 cursor-pointer group"
    >
      <div className={`relative ${hasNewStory ? 'p-[2px] bg-gradient-to-tr from-primary via-accent to-primary rounded-full' : ''}`}>
        <Avatar className={`w-16 h-16 border-2 ${hasNewStory ? 'border-background' : 'border-border'} group-hover:scale-105 transition-transform duration-200`}>
          <AvatarFallback className={`${isOwn ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground' : 'bg-secondary text-foreground'} font-semibold text-lg`}>
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {isOwn && (
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full border-2 border-background flex items-center justify-center shadow-md">
            <span className="text-xs text-primary-foreground font-bold">+</span>
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground max-w-[64px] truncate font-medium">
        {isOwn ? "Toi" : userName}
      </span>
    </div>
  );
};

export default StoryCircle;
