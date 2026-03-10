import { ReactNode, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Home, MessageSquare, Calendar as CalendarIcon, User, LogOut, Shield, Terminal as TerminalIcon, Wifi } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { currentUserStorage, messageStorage, userStorage } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import { NotificationCenter } from "@/components/NotificationCenter";
import { BlockedUserScreen } from "@/components/BlockedUserScreen";
import { blockStorage } from "@/lib/notifications";
import { useAutoRefresh } from "@/lib/useAutoRefresh";
import { Badge } from "@/components/ui/badge";
import { sessionManager, auditLog } from "@/lib/secureStorage";
import { startTracking, activityTracker } from "@/lib/activityTracker";
import { OnlineIndicator } from "@/components/OnlineIndicator";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const user = currentUserStorage.get();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockInfo, setBlockInfo] = useState<any>(null);
  const [onlineCount, setOnlineCount] = useState(0);

  const refreshCounts = useCallback(() => {
    if (user) {
      const count = messageStorage.getUnreadCount(user.id);
      setUnreadMessages(count);
      setOnlineCount(userStorage.getAll().length);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshCounts();
      
      const blocked = blockStorage.isBlocked(user.id);
      setIsBlocked(blocked);
      if (blocked) {
        setBlockInfo(blockStorage.getBlockInfo(user.id));
      }
    }
  }, [user, refreshCounts]);

  // Auto-refresh unread count
  useAutoRefresh(refreshCounts, 5000);

  const handleLogout = () => {
    currentUserStorage.clear();
    navigate("/");
  };

  const handleUnblock = () => {
    setIsBlocked(false);
    setBlockInfo(null);
  };

  if (!user) return null;
  
  // Show blocked screen if user is blocked
  if (isBlocked && blockInfo) {
    return <BlockedUserScreen blockInfo={blockInfo} onUnlock={handleUnblock} />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop & Tablet Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-screen md:w-56 lg:w-64 xl:w-72 bg-card/50 backdrop-blur-xl border-r border-border/50 z-40">
        {/* Logo / Brand */}
        <div className="p-4 lg:p-6 border-b border-border/30">
          <h1 className="text-xl lg:text-2xl font-bold glow-text flex items-center gap-2 lg:gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shrink-0">
              <Home className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <span className="truncate">Réseau Potes</span>
          </h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 lg:p-4 space-y-1.5 lg:space-y-2 overflow-y-auto">
          <NavLink
            to="/feed"
            className="flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
            activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
          >
            <Home className="w-5 h-5 transition-transform group-hover:scale-110 shrink-0" />
            <span className="font-medium text-sm lg:text-base">Accueil</span>
          </NavLink>
          
          <NavLink
            to="/messages"
            className="flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
            activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
          >
            <div className="relative shrink-0">
              <MessageSquare className="w-5 h-5 transition-transform group-hover:scale-110" />
              {unreadMessages > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center animate-pulse">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </div>
            <span className="font-medium text-sm lg:text-base">Messages</span>
            {unreadMessages > 0 && (
              <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-1 rounded-full font-semibold hidden lg:block">
                {unreadMessages}
              </span>
            )}
          </NavLink>
          
          <NavLink
            to="/calendar"
            className="flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
            activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
          >
            <CalendarIcon className="w-5 h-5 transition-transform group-hover:scale-110 shrink-0" />
            <span className="font-medium text-sm lg:text-base">Agenda</span>
          </NavLink>
          
          <NavLink
            to="/profile"
            className="flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
            activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
          >
            <User className="w-5 h-5 transition-transform group-hover:scale-110 shrink-0" />
            <span className="font-medium text-sm lg:text-base">Profil</span>
          </NavLink>

          {user && isAdmin(user.id) && (
            <>
              <div className="h-px bg-border/50 my-3 lg:my-4"></div>
              <NavLink
                to="/admin"
                className="flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
                activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
              >
                <Shield className="w-5 h-5 transition-transform group-hover:scale-110 shrink-0" />
                <span className="font-medium text-sm lg:text-base">Admin</span>
              </NavLink>
              
              <NavLink
                to="/terminal"
                className="flex items-center gap-3 lg:gap-4 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
                activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
              >
                <TerminalIcon className="w-5 h-5 transition-transform group-hover:scale-110 shrink-0" />
                <span className="font-medium text-sm lg:text-base">Terminal</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* User Profile + Logout */}
        <div className="p-3 lg:p-4 border-t border-border/30">
          <div className="flex items-center justify-between mb-2 lg:mb-3">
            <NotificationCenter />
            <Badge variant="outline" className="text-[10px] gap-1 border-primary/30">
              <Wifi className="w-3 h-3 text-primary" />
              {onlineCount} membres
            </Badge>
          </div>
          <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3 p-2 lg:p-3 rounded-xl bg-secondary/30">
            <Avatar className="border-2 border-primary/50 shadow-lg w-8 h-8 lg:w-10 lg:h-10 status-online">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-xs lg:text-sm">
                {getInitials(user.pseudo)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs lg:text-sm truncate">{user.pseudo}</p>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <p className="text-[10px] lg:text-xs text-muted-foreground">En ligne</p>
              </div>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full border-destructive/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive text-xs lg:text-sm"
          >
            <LogOut className="w-3 h-3 lg:w-4 lg:h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Mobile Header - Only visible on small screens */}
      <header className="md:hidden sticky top-0 z-50 w-full bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-lg safe-area-inset-top">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold glow-text">
            Réseau Potes
          </h1>
          <div className="flex items-center gap-1">
            <NotificationCenter />
            {user && isAdmin(user.id) && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/admin")}
                  className="hover:bg-secondary h-9 w-9"
                >
                  <Shield className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/terminal")}
                  className="hover:bg-secondary h-9 w-9"
                >
                  <TerminalIcon className="h-5 w-5" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hover:bg-destructive/10 hover:text-destructive h-9 w-9"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-56 lg:ml-64 xl:ml-72 pb-20 md:pb-6">
        {children}
      </main>

      {/* Bottom Navigation - Mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-border/30 shadow-xl safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          <NavLink
            to="/feed"
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all hover:bg-secondary/30 flex-1"
            activeClassName="text-primary scale-105"
          >
            <div className="relative">
              <Home className="w-6 h-6 transition-transform" />
            </div>
            <span className="text-[10px] font-semibold">Accueil</span>
          </NavLink>
          
          <NavLink
            to="/messages"
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all hover:bg-secondary/30 flex-1 relative"
            activeClassName="text-primary scale-105"
          >
            <div className="relative">
              <MessageSquare className="w-6 h-6 transition-transform" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-accent to-destructive text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center shadow-neon animate-pulse">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">Messages</span>
          </NavLink>
          
          <NavLink
            to="/calendar"
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all hover:bg-secondary/30 flex-1"
            activeClassName="text-primary scale-105"
          >
            <div className="relative">
              <CalendarIcon className="w-6 h-6 transition-transform" />
            </div>
            <span className="text-[10px] font-semibold">Agenda</span>
          </NavLink>
          
          <NavLink
            to="/profile"
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all hover:bg-secondary/30 flex-1"
            activeClassName="text-primary scale-105"
          >
            <div className="relative">
              <User className="w-6 h-6 transition-transform" />
            </div>
            <span className="text-[10px] font-semibold">Profil</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};
