import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Users, User, ArrowLeft, Search, MoreVertical, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { currentUserStorage, userStorage, messageStorage, groupStorage, type Group } from "@/lib/storage";
import { messageCreateSchema } from "@/lib/validators";
import { formatTimestamp, getInitials } from "@/lib/utils";
import { ZodError } from "zod";
import { CreateGroup } from "@/components/CreateGroup";
import { StartPrivateChat } from "@/components/StartPrivateChat";
import { AppLayout } from "@/components/AppLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MessagesNew = () => {
  const navigate = useNavigate();
  const [user] = useState(currentUserStorage.get());
  const [activeTab, setActiveTab] = useState<"private" | "groups">("private");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Private messages
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  // Group messages
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  
  const [newMessage, setNewMessage] = useState("");
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    loadConversations();
    loadGroups();
  }, [user, navigate]);

  useEffect(() => {
    if (activeTab === "private" && selectedUserId) {
      loadMessages(selectedUserId);
      messageStorage.markAsRead(user!.id, selectedUserId);
    } else if (activeTab === "groups" && selectedGroupId) {
      loadGroupMessages(selectedGroupId);
    }
  }, [selectedUserId, selectedGroupId, activeTab, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, groupMessages]);

  const loadConversations = () => {
    const convos = messageStorage.getConversations(user!.id);
    const enriched = convos.map(c => ({
      ...c,
      user: userStorage.getById(c.userId),
    }));
    setConversations(enriched);
  };

  const loadGroups = () => {
    const userGroups = groupStorage.getUserGroups(user!.id);
    setGroups(userGroups);
  };

  const loadMessages = (otherUserId: string) => {
    const msgs = messageStorage.getConversation(user!.id, otherUserId);
    setMessages(msgs);
  };

  const loadGroupMessages = (groupId: string) => {
    const msgs = messageStorage.getGroupMessages(groupId);
    const enriched = msgs.map(m => ({
      ...m,
      sender: userStorage.getById(m.senderId),
    }));
    setGroupMessages(enriched);
  };

  const handleSendPrivate = () => {
    if (!selectedUserId || !user) return;

    try {
      const validated = messageCreateSchema.parse({
        content: newMessage,
        receiverId: selectedUserId,
      });

      messageStorage.send({
        senderId: user.id,
        receiverId: validated.receiverId,
        content: validated.content,
      });

      setNewMessage("");
      loadMessages(selectedUserId);
      loadConversations();
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.issues[0].message);
      }
    }
  };

  const handleSendGroup = () => {
    if (!selectedGroupId || !user) return;

    try {
      if (newMessage.trim().length === 0) {
        toast.error("Le message ne peut pas être vide");
        return;
      }

      messageStorage.send({
        senderId: user.id,
        groupId: selectedGroupId,
        content: newMessage.trim(),
      });

      setNewMessage("");
      loadGroupMessages(selectedGroupId);
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message");
    }
  };

  const handleSend = () => {
    if (activeTab === "private") {
      handleSendPrivate();
    } else {
      handleSendGroup();
    }
  };

  const handleDeleteConversation = (userId: string) => {
    messageStorage.deleteConversation(user!.id, userId);
    loadConversations();
    if (selectedUserId === userId) {
      setSelectedUserId(null);
      setMessages([]);
    }
    toast.success("Conversation supprimée");
  };

  const handleLeaveGroup = (groupId: string) => {
    groupStorage.removeMember(groupId, user!.id);
    loadGroups();
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
      setGroupMessages([]);
    }
    toast.success("Vous avez quitté le groupe");
  };

  if (!user) return null;

  const selectedUser = selectedUserId ? userStorage.getById(selectedUserId) : null;
  const selectedGroup = selectedGroupId ? groupStorage.getById(selectedGroupId) : null;

  // Filter conversations and groups based on search
  const filteredConversations = conversations.filter(c => 
    c.user?.pseudo.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = activeTab === "private" ? messages : groupMessages;
  const hasSelection = selectedUserId || selectedGroupId;

  return (
    <AppLayout>
      <div className="h-[calc(100vh-140px)] lg:h-[calc(100vh-24px)] flex">
        {/* Sidebar - Conversations List */}
        <div
          className={`${
            hasSelection ? "hidden md:flex" : "flex"
          } flex-col w-full md:w-80 lg:w-96 border-r border-border/50 bg-card/30`}
        >
          {/* Header */}
          <div className="p-4 border-b border-border/30">
            <h1 className="text-xl font-bold glow-text mb-4">Messages</h1>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary/30 border-border/50"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2 mx-4 mt-2">
              <TabsTrigger value="private" className="gap-2">
                <User className="w-4 h-4" />
                Privés
              </TabsTrigger>
              <TabsTrigger value="groups" className="gap-2">
                <Users className="w-4 h-4" />
                Groupes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="private" className="flex-1 flex flex-col m-0 overflow-hidden">
              <div className="p-3 border-b border-border/20">
                <StartPrivateChat onUserSelected={(userId) => {
                  setSelectedUserId(userId);
                  setSelectedGroupId(null);
                }} />
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Aucune conversation</p>
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      Commence à discuter avec tes potes !
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/20">
                    {filteredConversations.map((convo) => (
                      <div
                        key={convo.userId}
                        className={`flex items-center gap-3 p-4 hover:bg-secondary/30 transition-all cursor-pointer group ${
                          selectedUserId === convo.userId ? "bg-primary/10 border-l-2 border-primary" : ""
                        }`}
                        onClick={() => {
                          setSelectedUserId(convo.userId);
                          setSelectedGroupId(null);
                        }}
                      >
                        <Avatar className="h-12 w-12 ring-2 ring-border/50">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                            {getInitials(convo.user?.pseudo || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold truncate">{convo.user?.pseudo || "Utilisateur supprimé"}</p>
                            <div className="flex items-center gap-2">
                              {convo.unreadCount > 0 && (
                                <span className="bg-accent text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                                  {convo.unreadCount}
                                </span>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteConversation(convo.userId);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {convo.lastMessage.content}
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            {formatTimestamp(convo.lastMessage.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="groups" className="flex-1 flex flex-col m-0 overflow-hidden">
              <div className="p-3 border-b border-border/20">
                <CreateGroup onGroupCreated={loadGroups} />
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredGroups.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Aucun groupe</p>
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      Créez un groupe pour discuter à plusieurs !
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/20">
                    {filteredGroups.map((group) => (
                      <div
                        key={group.id}
                        className={`flex items-center gap-3 p-4 hover:bg-secondary/30 transition-all cursor-pointer group ${
                          selectedGroupId === group.id ? "bg-primary/10 border-l-2 border-primary" : ""
                        }`}
                        onClick={() => {
                          setSelectedGroupId(group.id);
                          setSelectedUserId(null);
                        }}
                      >
                        <Avatar className="h-12 w-12 ring-2 ring-border/50">
                          <AvatarFallback className="bg-gradient-to-br from-secondary to-accent">
                            <Users className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold truncate">{group.name}</p>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGroupId(group.id);
                                  setShowGroupInfo(true);
                                }}>
                                  <Info className="w-4 h-4 mr-2" />
                                  Infos du groupe
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLeaveGroup(group.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Quitter le groupe
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {group.members.length} membres
                          </p>
                          {group.description && (
                            <p className="text-xs text-muted-foreground/70 truncate">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Area */}
        <div className={`${
          hasSelection ? "flex" : "hidden md:flex"
        } flex-1 flex-col bg-background/50`}>
          {!hasSelection ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div className="animate-fade-in">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30">
                  <Users className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2 glow-text">Sélectionne une conversation</h2>
                <p className="text-muted-foreground max-w-sm">
                  Choisis un contact ou un groupe pour commencer à discuter
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <header className="flex items-center gap-4 p-4 border-b border-border/30 bg-card/50 backdrop-blur-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedUserId(null);
                    setSelectedGroupId(null);
                  }}
                  className="md:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="h-10 w-10 ring-2 ring-primary/30">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                    {activeTab === "private" && selectedUser
                      ? getInitials(selectedUser.pseudo)
                      : <Users className="w-5 h-5" />
                    }
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="font-semibold">
                    {activeTab === "private" && selectedUser
                      ? selectedUser.pseudo
                      : selectedGroup?.name
                    }
                  </h2>
                  {activeTab === "groups" && selectedGroup && (
                    <p className="text-xs text-muted-foreground">
                      {selectedGroup.members.length} membres
                    </p>
                  )}
                  {activeTab === "private" && (
                    <p className="text-xs text-muted-foreground">En ligne</p>
                  )}
                </div>
                {activeTab === "groups" && selectedGroup && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowGroupInfo(true)}
                  >
                    <Info className="w-5 h-5" />
                  </Button>
                )}
              </header>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentMessages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <Send className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>Aucun message</p>
                      <p className="text-sm">Envoyez le premier message !</p>
                    </div>
                  </div>
                ) : (
                  currentMessages.map((msg: any, index: number) => {
                    const isOwn = msg.senderId === user.id;
                    const sender = activeTab === "groups" ? msg.sender : null;
                    const showAvatar = activeTab === "groups" && !isOwn;

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 animate-fade-in ${isOwn ? "justify-end" : "justify-start"}`}
                        style={{ animationDelay: `${index * 0.02}s` }}
                      >
                        {showAvatar && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="bg-gradient-to-br from-secondary to-accent text-xs font-semibold">
                              {getInitials(sender?.pseudo || "?")}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                          {showAvatar && (
                            <span className="text-xs text-muted-foreground mb-1 ml-1">
                              {sender?.pseudo || "Utilisateur supprimé"}
                            </span>
                          )}
                          <Card className={`px-4 py-2.5 shadow-sm ${
                            isOwn
                              ? "bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-2xl rounded-tr-sm"
                              : "bg-card border-border/50 rounded-2xl rounded-tl-sm"
                          }`}>
                            <p className="break-words text-sm">{msg.content}</p>
                          </Card>
                          <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                            {formatTimestamp(msg.timestamp)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border/30 bg-card/50 backdrop-blur-sm">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-3"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écris ton message..."
                    className="flex-1 bg-secondary/30 border-border/50"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    variant="gradient"
                    disabled={!newMessage.trim()}
                    className="shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Group Info Dialog */}
      <Dialog open={showGroupInfo} onOpenChange={setShowGroupInfo}>
        <DialogContent className="glass-effect border-primary/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 glow-text">
              <Users className="w-5 h-5" />
              {selectedGroup?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedGroup?.description || "Pas de description"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                Membres ({selectedGroup?.members.length || 0})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedGroup?.members.map(memberId => {
                  const member = userStorage.getById(memberId);
                  const isCreator = selectedGroup.createdBy === memberId;
                  return (
                    <div key={memberId} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
                          {getInitials(member?.pseudo || "?")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{member?.pseudo || "Utilisateur supprimé"}</span>
                      {isCreator && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-auto">
                          Créateur
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default MessagesNew;
