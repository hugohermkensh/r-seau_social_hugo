import { activityTracker } from "@/lib/activityTracker";
import { cn } from "@/lib/utils";

interface OnlineIndicatorProps {
  userId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

const statusColors = {
  online: "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]",
  away: "bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]",
  offline: "bg-muted-foreground/30",
};

export const OnlineIndicator = ({ userId, size = "md", className }: OnlineIndicatorProps) => {
  const status = activityTracker.getStatus(userId);

  return (
    <span
      className={cn(
        "rounded-full border-2 border-background inline-block",
        sizeMap[size],
        statusColors[status],
        status === "online" && "animate-pulse",
        className
      )}
      title={status === "online" ? "En ligne" : status === "away" ? "Absent" : "Hors ligne"}
    />
  );
};
