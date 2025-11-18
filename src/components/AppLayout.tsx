import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Home, MessageSquare, Calendar as CalendarIcon, User, LogOut, Shield, Terminal as TerminalIcon } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { currentUserStorage, messageStorage } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import { useState, useEffect } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const user = currentUserStorage.get();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (user) {
      const count = messageStorage.getUnreadCount(user.id);
      setUnreadMessages(count);
    }
  }, [user]);

  const handleLogout = () => {
    currentUserStorage.clear();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-64 xl:w-72 bg-card/50 backdrop-blur-xl border-r border-border/50 z-40">
        {/* Logo / Brand */}
        <div className="p-6 border-b border-border/30">
          <h1 className="text-2xl font-bold glow-text flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Home className="w-5 h-5 text-white" />
            </div>
            Réseau Potes
          </h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/feed"
            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
            activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
          >
            <Home className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="font-medium">Accueil</span>
          </NavLink>
          
          <NavLink
            to="/messages"
            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
            activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5 transition-transform group-hover:scale-110" />
              {unreadMessages > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center animate-pulse">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
            </div>
            <span className="font-medium">Messages</span>
            {unreadMessages > 0 && (
              <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-1 rounded-full font-semibold">
                {unreadMessages}
              </span>
            )}
          </NavLink>
          
          <NavLink
            to="/calendar"
            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
            activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
          >
            <CalendarIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="font-medium">Agenda</span>
          </NavLink>
          
          <NavLink
            to="/profile"
            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
            activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
          >
            <User className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="font-medium">Profil</span>
          </NavLink>

          {user && isAdmin(user.id) && (
            <>
              <div className="h-px bg-border/50 my-4"></div>
              <NavLink
                to="/admin"
                className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
                activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
              >
                <Shield className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="font-medium">Admin</span>
              </NavLink>
              
              <NavLink
                to="/terminal"
                className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all hover:bg-secondary/50 group relative overflow-hidden"
                activeClassName="bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-md border border-primary/30"
              >
                <TerminalIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="font-medium">Terminal</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* User Profile + Logout */}
        <div className="p-4 border-t border-border/30">
          <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-secondary/30">
            <Avatar className="border-2 border-primary/50 shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold text-sm">
                {getInitials(user.pseudo)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user.pseudo}</p>
              <p className="text-xs text-muted-foreground">En ligne</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-destructive/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Mobile Header - Only visible on mobile */}
      <header className="lg:hidden sticky top-0 z-50 w-full bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold glow-text">
            Réseau Potes
          </h1>
          <div className="flex items-center gap-2">
            {user && isAdmin(user.id) && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/admin")}
                  className="hover:bg-secondary"
                >
                  <Shield className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/terminal")}
                  className="hover:bg-secondary"
                >
                  <TerminalIcon className="h-5 w-5" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 xl:ml-72 pb-20 lg:pb-6">
        {children}
      </main>

      {/* Bottom Navigation - Mobile only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-border/30 shadow-xl">
        <div className="flex items-center justify-around px-2 py-2">
          <NavLink
            to="/feed"
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-secondary/30 flex-1"
            activeClassName="text-primary scale-105"
          >
            <div className="relative">
              <Home className="w-6 h-6 transition-transform" />
            </div>
            <span className="text-[10px] font-semibold">Accueil</span>
          </NavLink>
          
          <NavLink
            to="/messages"
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-secondary/30 flex-1 relative"
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
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-secondary/30 flex-1"
            activeClassName="text-primary scale-105"
          >
            <div className="relative">
              <CalendarIcon className="w-6 h-6 transition-transform" />
            </div>
            <span className="text-[10px] font-semibold">Agenda</span>
          </NavLink>
          
          <NavLink
            to="/profile"
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-secondary/30 flex-1"
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
