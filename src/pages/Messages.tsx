import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { currentUserStorage, userStorage, messageStorage } from "@/lib/storage";
import { messageCreateSchema } from "@/lib/validators";
import { formatTimestamp, getInitials } from "@/lib/utils";
import { ZodError } from "zod";

const Messages = () => {
  const navigate = useNavigate();
  const [user] = useState(currentUserStorage.get());
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    loadConversations();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
      messageStorage.markAsRead(user!.id, selectedUserId);
    }
  }, [selectedUserId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = () => {
    const convos = messageStorage.getConversations(user!.id);
    const enriched = convos.map(c => ({
      ...c,
      user: userStorage.getById(c.userId),
    }));
    setConversations(enriched);
  };

  const loadMessages = (otherUserId: string) => {
    const msgs = messageStorage.getConversation(user!.id, otherUserId);
    setMessages(msgs);
  };

  const handleSend = () => {
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

  if (!user) return null;

  const selectedUser = selectedUserId ? userStorage.getById(selectedUserId) : null;

  return (
    <div className="min-h-screen flex">
      {/* Conversations List */}
      <div
        className={`${
          selectedUserId ? "hidden md:block" : "block"
        } w-full md:w-80 border-r border-border/50 glass-effect`}
      >
        <header className="sticky top-0 z-50 glass-effect border-b border-primary/30 backdrop-blur-xl">
          <div className="px-4 py-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/feed")}
              className="hover:bg-primary/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold glow-text">Messages</h1>
          </div>
        </header>

        <div className="overflow-y-auto h-[calc(100vh-73px)]">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Aucune conversation</p>
              <p className="text-xs text-muted-foreground mt-2">
                Commence à discuter avec tes potes !
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {conversations.map((convo) => (
                <button
                  key={convo.userId}
                  onClick={() => setSelectedUserId(convo.userId)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-primary/10 transition-colors ${
                    selectedUserId === convo.userId ? "bg-primary/20" : ""
                  }`}
                >
                  <Avatar className="border-2 border-primary/50">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold">
                      {getInitials(convo.user?.pseudo || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground">
                        {convo.user?.pseudo}
                      </span>
                      {convo.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {convo.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {convo.lastMessage.senderId === user.id ? "Vous: " : ""}
                      {convo.lastMessage.content}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedUserId ? "block" : "hidden md:block"} flex-1 flex flex-col`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <header className="glass-effect border-b border-primary/30 backdrop-blur-xl p-4 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedUserId(null)}
                className="md:hidden hover:bg-primary/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Avatar className="border-2 border-primary/50">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold">
                  {getInitials(selectedUser.pseudo)}
                </AvatarFallback>
              </Avatar>
              <h2 className="font-semibold text-foreground">{selectedUser.pseudo}</h2>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isOwn = msg.senderId === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        isOwn
                          ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                          : "glass-effect border border-border/50 text-foreground"
                      } rounded-2xl px-4 py-2`}
                    >
                      <p className="break-words">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {formatTimestamp(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="glass-effect border-t border-primary/30 p-4">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Écris un message..."
                  className="bg-secondary/50 border-border/50"
                  maxLength={2000}
                />
                <Button
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">
              Sélectionne une conversation pour commencer
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
