import { useState, useRef } from "react";
import { Download, Upload, RefreshCw, Database, HardDrive, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { dataSync } from "@/lib/dataSync";

export const DataSyncManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [mergeMode, setMergeMode] = useState<"replace" | "merge">("merge");
  const [stats, setStats] = useState(dataSync.getStats());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      dataSync.downloadData();
      toast.success("Données exportées avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await dataSync.readFile(file);
      const success = dataSync.importData(data, mergeMode);
      
      if (success) {
        toast.success("Données importées avec succès");
        setStats(dataSync.getStats());
      } else {
        toast.error("Erreur lors de l'import");
      }
    } catch (error) {
      toast.error("Fichier invalide");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const refreshStats = () => {
    setStats(dataSync.getStats());
    toast.success("Statistiques mises à jour");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Database className="w-4 h-4" />
          Sync données
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-effect border-primary/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 glow-text">
            <HardDrive className="w-5 h-5" />
            Synchronisation des données
          </DialogTitle>
          <DialogDescription>
            Exportez et importez vos données pour les partager entre appareils sur votre réseau local.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Stats */}
          <Card className="bg-secondary/30 border-border/30">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Données actuelles</CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refreshStats}>
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-background/50 rounded">
                  <p className="font-bold text-primary">{stats.users}</p>
                  <p className="text-muted-foreground">Utilisateurs</p>
                </div>
                <div className="p-2 bg-background/50 rounded">
                  <p className="font-bold text-primary">{stats.posts}</p>
                  <p className="text-muted-foreground">Posts</p>
                </div>
                <div className="p-2 bg-background/50 rounded">
                  <p className="font-bold text-primary">{stats.messages}</p>
                  <p className="text-muted-foreground">Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export */}
          <Button onClick={handleExport} className="w-full gap-2" variant="gradient">
            <Download className="w-4 h-4" />
            Exporter toutes les données
          </Button>

          {/* Import Options */}
          <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border/30">
            <Label className="text-sm font-medium">Mode d'import</Label>
            <RadioGroup value={mergeMode} onValueChange={(v) => setMergeMode(v as "replace" | "merge")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="merge" id="merge" />
                <Label htmlFor="merge" className="text-sm cursor-pointer">
                  <span className="font-medium">Fusionner</span>
                  <span className="text-muted-foreground ml-1">- Ajoute les nouvelles données</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replace" id="replace" />
                <Label htmlFor="replace" className="text-sm cursor-pointer">
                  <span className="font-medium">Remplacer</span>
                  <span className="text-muted-foreground ml-1">- Écrase tout</span>
                </Label>
              </div>
            </RadioGroup>

            <Button 
              onClick={handleImportClick} 
              className="w-full gap-2" 
              variant="outline"
              disabled={isImporting}
            >
              {isImporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Importer des données
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Instructions */}
          <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <AlertTriangle className="w-3 h-3 inline mr-1 text-accent" />
              Pour synchroniser entre appareils: exportez depuis un appareil, transférez le fichier, puis importez sur l'autre.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
