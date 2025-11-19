import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar as CalendarIcon, MapPin, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { currentUserStorage, eventStorage, userStorage } from "@/lib/storage";
import { eventCreateSchema } from "@/lib/validators";
import { formatTimestamp } from "@/lib/utils";
import { ZodError } from "zod";
import { AppLayout } from "@/components/AppLayout";

const Calendar = () => {
  const navigate = useNavigate();
  const [user] = useState(currentUserStorage.get());
  const [events, setEvents] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  
  // Form state
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

  // Group events by month
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
        <header className="sticky top-0 z-40 glass-effect border-b border-primary/30 backdrop-blur-xl lg:relative">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold glow-text">Calendrier</h1>

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground">
                <Plus className="w-5 h-5 mr-2" />
                Événement
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect border-primary/30">
              <DialogHeader>
                <DialogTitle className="glow-text">Créer un événement</DialogTitle>
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
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground"
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
          <Card className="glass-effect border-primary/30 p-8 text-center">
            <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">Aucun événement à venir</p>
            <p className="text-xs text-muted-foreground">
              Crée un événement pour planifier avec tes potes !
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(eventsByMonth).map(([month, monthEvents]) => (
              <div key={month}>
                <h2 className="text-lg font-semibold text-primary mb-3 capitalize">
                  {month}
                </h2>
                <div className="space-y-3">
                  {monthEvents.map((event) => {
                    const isParticipating = event.participants.includes(user.id);
                    const isCreator = event.createdBy === user.id;
                    const creator = userStorage.getById(event.createdBy);

                    return (
                      <Card
                        key={event.id}
                        className="glass-effect border-primary/30 p-4 hover:border-primary/50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground text-lg mb-1">
                              {event.title}
                            </h3>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          {isCreator && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteEvent(event.id, event.createdBy)}
                              className="hover:bg-destructive/20 hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarIcon className="w-4 h-4" />
                            <span>
                              {new Date(event.date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                              })}
                              {event.time && ` à ${event.time}`}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{event.participants.length} participant(s)</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                          <span className="text-xs text-muted-foreground">
                            Créé par {creator?.pseudo || "Inconnu"}
                          </span>
                          <Button
                            onClick={() => handleToggleParticipation(event.id)}
                            variant={isParticipating ? "outline" : "default"}
                            size="sm"
                            className={
                              isParticipating
                                ? "border-primary/50"
                                : "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                            }
                          >
                            {isParticipating ? "Ne plus participer" : "Participer"}
                          </Button>
                        </div>
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
  );
};

export default Calendar;
