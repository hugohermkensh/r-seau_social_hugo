import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Plus } from "lucide-react";
import { userStorage, currentUserStorage } from "@/lib/storage";
import { getInitials } from "@/lib/utils";

interface StartPrivateChatProps {
  onUserSelected: (userId: string) => void;
}

export const StartPrivateChat = ({ onUserSelected }: StartPrivateChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentUser = currentUserStorage.get();
  const allUsers = userStorage.getAll().filter(u => u.id !== currentUser?.id);

  const handleSelectUser = (userId: string) => {
    onUserSelected(userId);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Nouvelle conversation
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-effect border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 glow-text">
            <User className="w-5 h-5" />
            Démarrer une conversation
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un utilisateur pour commencer à discuter
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {allUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun autre utilisateur disponible
            </p>
          ) : (
            allUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user.id)}
                className="w-full p-3 flex items-center gap-3 hover:bg-accent/50 rounded-lg transition-colors border border-transparent hover:border-primary/20"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {getInitials(user.pseudo)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{user.pseudo}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.role === 'admin' ? 'Administrateur' : 'Membre'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
