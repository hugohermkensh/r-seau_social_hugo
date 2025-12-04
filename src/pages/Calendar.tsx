import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar as CalendarIcon, MapPin, Users, Trash2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { currentUserStorage, eventStorage, userStorage } from "@/lib/storage";
import { eventCreateSchema } from "@/lib/validators";
import { ZodError } from "zod";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const Calendar = () => {
  const navigate = useNavigate();
  const [user] = useState(currentUserStorage.get());
  const [events, setEvents] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    loadEvents();
  }, [user, navigate]);

  const loadEvents = () => {
    const allEvents = eventStorage.getUpcoming();
    setEvents(allEvents);
  };

  const handleCreateEvent = () => {
    if (!user) return;

    try {
      const validated = eventCreateSchema.parse({
        title,
        description,
        date,
        time,
        location,
      });

      eventStorage.create({
        ...validated,
        createdBy: user.id,
        participants: [user.id],
      });

      toast.success("Événement créé !");
      setShowDialog(false);
      resetForm();
      loadEvents();
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.issues[0].message);
      }
    }
  };

  const handleToggleParticipation = (eventId: string) => {
    if (!user) return;
    eventStorage.toggleParticipant(eventId, user.id);
    loadEvents();
    toast.success("Participation mise à jour");
  };

  const handleDeleteEvent = (eventId: string, createdBy: string) => {
    if (!user || user.id !== createdBy) {
      toast.error("Tu ne peux supprimer que tes propres événements");
      return;
    }
    
    eventStorage.delete(eventId);
    loadEvents();
    toast.success("Événement supprimé");
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setLocation("");
  };

  if (!user) return null;

  const eventsByMonth = events.reduce<Record<string, typeof events>>((acc, event) => {
    const month = new Date(event.date).toLocaleDateString('fr-FR', { 
      month: 'long', 
      year: 'numeric' 
    });
    if (!acc[month]) acc[month] = [];
    acc[month].push(event);
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 glass-effect border-b border-border/20 backdrop-blur-xl lg:relative">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-2xl">
            <h1 className="text-2xl font-bold glow-text flex items-center gap-2">
              <CalendarIcon className="w-6 h-6" />
              Agenda
            </h1>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button variant="gradient" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Événement
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-effect border-primary/30">
                <DialogHeader>
                  <DialogTitle className="glow-text flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Créer un événement
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Titre *</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Soirée, sortie..."
                      className="bg-secondary/50 border-border/50 mt-1"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Détails de l'événement..."
                      className="bg-secondary/50 border-border/50 resize-none mt-1"
                      rows={3}
                      maxLength={500}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date *</Label>
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-secondary/50 border-border/50 mt-1"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label>Heure</Label>
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="bg-secondary/50 border-border/50 mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Lieu</Label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Adresse ou lieu..."
                      className="bg-secondary/50 border-border/50 mt-1"
                      maxLength={200}
                    />
                  </div>
                  <Button
                    onClick={handleCreateEvent}
                    variant="gradient"
                    className="w-full"
                  >
                    Créer l'événement
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {events.length === 0 ? (
            <Card className="glass-effect border-primary/20 p-12 text-center">
              <CalendarIcon className="w-20 h-20 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg text-muted-foreground font-medium mb-2">Aucun événement à venir</p>
              <p className="text-sm text-muted-foreground/70">
                Crée un événement pour planifier avec tes potes !
              </p>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(eventsByMonth).map(([month, monthEvents]) => (
                <div key={month}>
                  <h2 className="text-lg font-semibold text-primary mb-4 capitalize flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {month}
                  </h2>
                  <div className="space-y-4">
                    {monthEvents.map((event, index) => {
                      const isParticipating = event.participants.includes(user.id);
                      const isCreator = event.createdBy === user.id;
                      const creator = userStorage.getById(event.createdBy);
                      const eventDate = new Date(event.date);
                      const isToday = eventDate.toDateString() === new Date().toDateString();

                      return (
                        <Card
                          key={event.id}
                          className={`glass-effect p-5 transition-all animate-slide-up ${
                            isToday 
                              ? "border-accent/40 bg-accent/5" 
                              : "border-primary/10 hover:border-primary/30"
                          }`}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex gap-4">
                              {/* Date Badge */}
                              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-primary/10 border border-primary/20 min-w-[60px]">
                                <span className="text-xs font-medium text-primary uppercase">
                                  {eventDate.toLocaleDateString('fr-FR', { weekday: 'short' })}
                                </span>
                                <span className="text-2xl font-bold text-foreground">
                                  {eventDate.getDate()}
                                </span>
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg">{event.title}</h3>
                                  {isToday && (
                                    <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                                      Aujourd'hui
                                    </Badge>
                                  )}
                                </div>
                                {event.description && (
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {event.description}
                                  </p>
                                )}
                                
                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                  {event.time && (
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-4 h-4 text-primary" />
                                      <span>{event.time}</span>
                                    </div>
                                  )}
                                  {event.location && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin className="w-4 h-4 text-accent" />
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {isCreator && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteEvent(event.id, event.createdBy)}
                                className="hover:bg-destructive/20 hover:text-destructive shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          {/* Participants & Actions */}
                          <div className="flex items-center justify-between pt-4 border-t border-border/20">
                            <div className="flex items-center gap-3">
                              <div className="flex -space-x-2">
                                {event.participants.slice(0, 5).map((pId: string) => {
                                  const participant = userStorage.getById(pId);
                                  return (
                                    <Avatar key={pId} className="h-8 w-8 border-2 border-card">
                                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
                                        {getInitials(participant?.pseudo || "?")}
                                      </AvatarFallback>
                                    </Avatar>
                                  );
                                })}
                                {event.participants.length > 5 && (
                                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium border-2 border-card">
                                    +{event.participants.length - 5}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {event.participants.length} participant{event.participants.length > 1 ? "s" : ""}
                              </span>
                            </div>
                            
                            <Button
                              onClick={() => handleToggleParticipation(event.id)}
                              variant={isParticipating ? "outline" : "gradient"}
                              size="sm"
                              className={`gap-2 ${isParticipating ? "border-primary/30" : ""}`}
                            >
                              {isParticipating ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-primary" />
                                  Inscrit
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4" />
                                  Participer
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {/* Creator Info */}
                          <p className="text-xs text-muted-foreground/60 mt-3">
                            Créé par {creator?.pseudo || "Inconnu"}
                          </p>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Calendar;
