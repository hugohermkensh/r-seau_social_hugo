import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, MessageSquare, Heart, Calendar, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { notificationStorage, type Notification } from "@/lib/notifications";
import { currentUserStorage } from "@/lib/storage";
import { formatTimestamp } from "@/lib/utils";

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "message":
      return <MessageSquare className="w-4 h-4 text-primary" />;
    case "like":
      return <Heart className="w-4 h-4 text-accent" />;
    case "comment":
      return <MessageSquare className="w-4 h-4 text-primary" />;
    case "event":
      return <Calendar className="w-4 h-4 text-accent" />;
    case "group":
      return <Users className="w-4 h-4 text-primary" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const user = currentUserStorage.get();

  useEffect(() => {
    if (!user) return;
    loadNotifications();
    
    // Poll for new notifications every 5 seconds
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const loadNotifications = () => {
    if (!user) return;
    const userNotifications = notificationStorage.getByUser(user.id);
    setNotifications(userNotifications.slice(0, 50)); // Limit to 50 most recent
    setUnreadCount(notificationStorage.getUnreadCount(user.id));
  };

  const handleMarkAsRead = (notificationId: string) => {
    notificationStorage.markAsRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    if (!user) return;
    notificationStorage.markAllAsRead(user.id);
    loadNotifications();
  };

  const handleDelete = (notificationId: string) => {
    notificationStorage.delete(notificationId);
    loadNotifications();
  };

  const handleClearAll = () => {
    if (!user) return;
    notificationStorage.clearAll(user.id);
    loadNotifications();
  };

  if (!user) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-primary/10"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-accent text-accent-foreground text-xs animate-pulse"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 sm:w-96 p-0 glass-effect border-primary/30" 
        align="end"
        sideOffset={8}
      >
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold glow-text flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs h-7 gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Tout lire
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs h-7 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="h-[300px] sm:h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-secondary/30 transition-colors cursor-pointer ${
                    !notification.read ? "bg-primary/5 border-l-2 border-primary" : ""
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-card rounded-full">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
