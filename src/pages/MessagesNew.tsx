import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Users, User, ArrowLeft, Search, MoreVertical, Trash2, Info, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { currentUserStorage, userStorage, messageStorage, groupStorage, type Group } from "@/lib/storage";
import { messageCreateSchema } from "@/lib/validators";
import { formatTimestamp, getInitials } from "@/lib/utils";
import { ZodError } from "zod";
import { CreateGroup } from "@/components/CreateGroup";
import { StartPrivateChat } from "@/components/StartPrivateChat";
import { AppLayout } from "@/components/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
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
        {/* Sidebar */}
        <div
          className={`${
            hasSelection ? "hidden md:flex" : "flex"
          } flex-col w-full md:w-80 lg:w-96 border-r border-border/30 bg-card/30`}
        >
          {/* Header */}
          <div className="p-4 border-b border-border/20">
            <h1 className="text-2xl font-bold glow-text mb-4 flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              Messages
            </h1>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary/30 border-border/30"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2 mx-4 mt-3 bg-secondary/50">
              <TabsTrigger value="private" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <User className="w-4 h-4" />
                Privés
              </TabsTrigger>
              <TabsTrigger value="groups" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="w-4 h-4" />
                Groupes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="private" className="flex-1 flex flex-col m-0 overflow-hidden">
              <div className="p-3 border-b border-border/10">
                <StartPrivateChat onUserSelected={(userId) => {
                  setSelectedUserId(userId);
                  setSelectedGroupId(null);
                }} />
              </div>
              <ScrollArea className="flex-1">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-medium">Aucune conversation</p>
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      Commence à discuter !
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/10">
                    {filteredConversations.map((convo) => (
                      <div
                        key={convo.userId}
                        className={`flex items-center gap-3 p-4 hover:bg-secondary/30 transition-all cursor-pointer group ${
                          selectedUserId === convo.userId ? "bg-primary/10 border-l-4 border-primary" : ""
                        }`}
                        onClick={() => {
                          setSelectedUserId(convo.userId);
                          setSelectedGroupId(null);
                        }}
                      >
                        <Avatar className="h-12 w-12 border-2 border-border/30 shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                            {getInitials(convo.user?.pseudo || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold truncate">{convo.user?.pseudo || "Utilisateur supprimé"}</p>
                            <div className="flex items-center gap-2">
                              {convo.unreadCount > 0 && (
                                <span className="bg-accent text-primary-foreground text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
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
                                    className="text-destructive focus:text-destructive"
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
                          <p className="text-xs text-muted-foreground/60">
                            {formatTimestamp(convo.lastMessage.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="groups" className="flex-1 flex flex-col m-0 overflow-hidden">
              <div className="p-3 border-b border-border/10">
                <CreateGroup onGroupCreated={loadGroups} />
              </div>
              <ScrollArea className="flex-1">
                {filteredGroups.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-medium">Aucun groupe</p>
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      Créez un groupe pour discuter !
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/10">
                    {filteredGroups.map((group) => (
                      <div
                        key={group.id}
                        className={`flex items-center gap-3 p-4 hover:bg-secondary/30 transition-all cursor-pointer group ${
                          selectedGroupId === group.id ? "bg-primary/10 border-l-4 border-primary" : ""
                        }`}
                        onClick={() => {
                          setSelectedGroupId(group.id);
                          setSelectedUserId(null);
                        }}
                      >
                        <Avatar className="h-12 w-12 border-2 border-border/30 shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-secondary to-accent">
                            <Users className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
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
                                  Infos
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLeaveGroup(group.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Quitter
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {group.members.length} membres
                          </p>
                          {group.description && (
                            <p className="text-xs text-muted-foreground/60 truncate">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Area */}
        <div className={`${
          hasSelection ? "flex" : "hidden md:flex"
        } flex-1 flex-col bg-background/30`}>
          {!hasSelection ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div className="animate-fade-in">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30">
                  <MessageSquare className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2 glow-text">Sélectionne une conversation</h2>
                <p className="text-muted-foreground max-w-sm">
                  Choisis un contact ou un groupe pour commencer
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <header className="flex items-center gap-4 p-4 border-b border-border/20 bg-card/50 backdrop-blur-sm">
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
                <Avatar className="h-10 w-10 border-2 border-primary/30">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                    {activeTab === "private" && selectedUser
                      ? getInitials(selectedUser.pseudo)
                      : <Users className="w-5 h-5" />
                    }
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="font-semibold">
                    {activeTab === "private" ? selectedUser?.pseudo : selectedGroup?.name}
                  </h2>
                  {activeTab === "groups" && selectedGroup && (
                    <p className="text-xs text-muted-foreground">
                      {selectedGroup.members.length} membres
                    </p>
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
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {currentMessages.map((msg) => {
                    const isOwn = msg.senderId === user.id;
                    const sender = activeTab === "groups" 
                      ? (msg.sender || userStorage.getById(msg.senderId))
                      : null;

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-fade-in`}
                      >
                        <div className={`flex gap-2 max-w-[80%] ${isOwn ? "flex-row-reverse" : ""}`}>
                          {activeTab === "groups" && !isOwn && (
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
                                {getInitials(sender?.pseudo || "?")}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            {activeTab === "groups" && !isOwn && (
                              <p className="text-xs text-muted-foreground mb-1 ml-1">
                                {sender?.pseudo || "Inconnu"}
                              </p>
                            )}
                            <div
                              className={`px-4 py-3 rounded-2xl shadow-sm ${
                                isOwn
                                  ? "bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-br-md"
                                  : "bg-card border border-border/30 rounded-bl-md"
                              }`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>
                            </div>
                            <p className={`text-[10px] text-muted-foreground mt-1 ${isOwn ? "text-right mr-1" : "ml-1"}`}>
                              {formatTimestamp(msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border/20 bg-card/50 backdrop-blur-sm">
                <div className="flex gap-3 max-w-3xl mx-auto">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écris ton message..."
                    className="bg-secondary/30 border-border/30 flex-1"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && newMessage.trim()) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    maxLength={2000}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    variant="gradient"
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Group Info Dialog */}
      <Dialog open={showGroupInfo} onOpenChange={setShowGroupInfo}>
        <DialogContent className="glass-effect border-primary/30">
          <DialogHeader>
            <DialogTitle className="glow-text flex items-center gap-2">
              <Users className="w-5 h-5" />
              {selectedGroup?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedGroup?.description || "Aucune description"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <h4 className="font-semibold mb-3 text-sm">Membres ({selectedGroup?.members.length})</h4>
              <div className="space-y-2">
                {selectedGroup?.members.map((memberId) => {
                  const member = userStorage.getById(memberId);
                  const isCreator = memberId === selectedGroup?.createdBy;
                  return (
                    <div key={memberId} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
                          {getInitials(member?.pseudo || "?")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm flex-1">{member?.pseudo || "Inconnu"}</span>
                      {isCreator && (
                        <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
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
