import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Users, User, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { currentUserStorage, userStorage, messageStorage, groupStorage, type Group } from "@/lib/storage";
import { messageCreateSchema } from "@/lib/validators";
import { formatTimestamp, getInitials } from "@/lib/utils";
import { ZodError } from "zod";
import { CreateGroup } from "@/components/CreateGroup";
import { StartPrivateChat } from "@/components/StartPrivateChat";
import { AppLayout } from "@/components/AppLayout";

const MessagesNew = () => {
  const navigate = useNavigate();
  const [user] = useState(currentUserStorage.get());
  const [activeTab, setActiveTab] = useState<"private" | "groups">("private");
  
  // Private messages
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  // Group messages
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  
  const [newMessage, setNewMessage] = useState("");
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

  if (!user) return null;

  const selectedUser = selectedUserId ? userStorage.getById(selectedUserId) : null;
  const selectedGroup = selectedGroupId ? groupStorage.getById(selectedGroupId) : null;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div
        className={`${
          (selectedUserId || selectedGroupId) ? "hidden md:block" : "block"
        } w-full md:w-80 border-r border-border glass-effect`}
      >
        <header className="sticky top-0 z-50 glass-effect border-b border-border backdrop-blur-xl">
          <div className="px-4 py-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/feed")}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Messages</h1>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="w-full grid grid-cols-2 m-2">
            <TabsTrigger value="private" className="gap-2">
              <User className="w-4 h-4" />
              Privés
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-2">
              <Users className="w-4 h-4" />
              Groupes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="private" className="m-0">
            <div className="p-2">
              <StartPrivateChat onUserSelected={(userId) => {
                setSelectedUserId(userId);
                setSelectedGroupId(null);
              }} />
            </div>
            <div className="overflow-y-auto h-[calc(100vh-215px)]">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">Aucune conversation</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Commence à discuter avec tes potes !
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {conversations.map((convo) => (
                    <button
                      key={convo.userId}
                      onClick={() => {
                        setSelectedUserId(convo.userId);
                        setSelectedGroupId(null);
                      }}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors ${
                        selectedUserId === convo.userId ? "bg-accent" : ""
                      }`}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                          {getInitials(convo.user?.pseudo || "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{convo.user?.pseudo || "Utilisateur supprimé"}</p>
                          {convo.unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                              {convo.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {convo.lastMessage.content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(convo.lastMessage.timestamp)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="groups" className="m-0">
            <div className="p-2">
              <CreateGroup onGroupCreated={loadGroups} />
            </div>
            <div className="overflow-y-auto h-[calc(100vh-215px)]">
              {groups.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucun groupe</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Créez un groupe pour discuter à plusieurs !
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        setSelectedUserId(null);
                      }}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors ${
                        selectedGroupId === group.id ? "bg-accent" : ""
                      }`}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-secondary to-accent">
                          <Users className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-semibold">{group.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {group.members.length} membres
                        </p>
                        {group.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Area */}
      <div className={`${
        (selectedUserId || selectedGroupId) ? "block" : "hidden md:block"
      } flex-1 flex flex-col`}>
        {!selectedUserId && !selectedGroupId ? (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Users className="w-12 h-12 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Sélectionne une conversation</h2>
              <p className="text-muted-foreground">
                Choisis un contact ou un groupe pour commencer à discuter
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="sticky top-0 z-50 glass-effect border-b border-border backdrop-blur-xl">
              <div className="px-4 py-4 flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedUserId(null);
                    setSelectedGroupId(null);
                  }}
                  className="md:hidden hover:bg-primary/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {activeTab === "private" && selectedUser
                      ? getInitials(selectedUser.pseudo)
                      : <Users className="w-5 h-5" />
                    }
                  </AvatarFallback>
                </Avatar>
                <div>
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
                </div>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(activeTab === "private" ? messages : groupMessages).map((msg: any) => {
                const isOwn = msg.senderId === user.id;
                const sender = activeTab === "groups" ? msg.sender : null;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    {!isOwn && activeTab === "groups" && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-gradient-to-br from-secondary to-accent text-xs">
                          {getInitials(sender?.pseudo || "?")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                      {!isOwn && activeTab === "groups" && (
                        <span className="text-xs text-muted-foreground mb-1">
                          {sender?.pseudo || "Utilisateur supprimé"}
                        </span>
                      )}
                      <Card className={`p-3 ${
                        isOwn
                          ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                          : "bg-muted"
                      }`}>
                        <p className="break-words">{msg.content}</p>
                      </Card>
                      <span className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border glass-effect">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écris ton message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" variant="gradient">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessagesNew;
