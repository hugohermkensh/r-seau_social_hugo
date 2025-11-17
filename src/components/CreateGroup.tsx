import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { groupStorage, userStorage, currentUserStorage } from "@/lib/storage";

export const CreateGroup = ({ onGroupCreated }: { onGroupCreated?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const currentUser = currentUserStorage.get();
  const allUsers = userStorage.getAll().filter(u => u.id !== currentUser?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) return;
    
    if (name.length < 1 || name.length > 50) {
      toast.error("Le nom doit contenir entre 1 et 50 caractères");
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error("Sélectionnez au moins un membre");
      return;
    }

    try {
      groupStorage.create({
        name,
        description,
        members: [currentUser.id, ...selectedMembers],
        createdBy: currentUser.id,
      });

      toast.success(`Groupe "${name}" créé avec succès`);
      setIsOpen(false);
      setName("");
      setDescription("");
      setSelectedMembers([]);
      onGroupCreated?.();
    } catch (error) {
      toast.error("Erreur lors de la création du groupe");
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau groupe
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-effect border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 glow-text">
            <Users className="w-5 h-5" />
            Créer un groupe
          </DialogTitle>
          <DialogDescription>
            Créez un groupe de discussion avec vos amis
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Nom du groupe *</Label>
            <Input
              id="groupName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mon groupe cool"
              maxLength={50}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupDescription">Description</Label>
            <Textarea
              id="groupDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="De quoi parle ce groupe ?"
              maxLength={200}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Membres du groupe *</Label>
            <div className="border border-border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
              {allUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun autre utilisateur disponible
                </p>
              ) : (
                allUsers.map(user => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedMembers.includes(user.id)}
                      onCheckedChange={() => toggleMember(user.id)}
                    />
                    <label
                      htmlFor={`user-${user.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {user.pseudo}
                    </label>
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedMembers.length} membre(s) sélectionné(s)
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="gradient"
              className="flex-1"
              disabled={!name || selectedMembers.length === 0}
            >
              Créer le groupe
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
