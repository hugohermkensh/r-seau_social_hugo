import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { userStorage, type User } from "@/lib/storage";
import { getInitials } from "@/lib/utils";
import { OnlineIndicator } from "@/components/OnlineIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserSearchProps {
  onSelect?: (user: User) => void;
  exclude?: string[];
  placeholder?: string;
}

export const UserSearch = ({ onSelect, exclude = [], placeholder = "Rechercher un utilisateur..." }: UserSearchProps) => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);

  useEffect(() => {
    setUsers(userStorage.getAll().filter(u => !exclude.includes(u.id)));
  }, [exclude]);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered([]);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(users.filter(u => 
      u.pseudo.toLowerCase().includes(q) ||
      u.bio?.toLowerCase().includes(q)
    ));
  }, [query, users]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length > 0 && (
        <ScrollArea className="max-h-48">
          <div className="space-y-1">
            {filtered.map(user => (
              <button
                key={user.id}
                onClick={() => { onSelect?.(user); setQuery(""); }}
                className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{getInitials(user.pseudo)}</AvatarFallback>
                  </Avatar>
                  <OnlineIndicator 
                    userId={user.id} 
                    size="sm" 
                    className="absolute -bottom-0.5 -right-0.5" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.pseudo}</p>
                  {user.bio && (
                    <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
                  )}
                </div>
                <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-[10px]">
                  {user.role}
                </Badge>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
