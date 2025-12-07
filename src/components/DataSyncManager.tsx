import { useState, useRef, useEffect } from "react";
import { Download, Upload, RefreshCw, Database, HardDrive, Check, AlertTriangle, Copy, Wifi, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { dataSync } from "@/lib/dataSync";
import { syncManager } from "@/lib/syncManager";

export const DataSyncManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [mergeMode, setMergeMode] = useState<"replace" | "merge">("merge");
  const [stats, setStats] = useState(dataSync.getStats());
  const [syncCode, setSyncCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLastUpdate(syncManager.getLastUpdate());
    
    // Listen for sync updates from other tabs
    const cleanup = syncManager.setupStorageListener(() => {
      setStats(dataSync.getStats());
      setLastUpdate(syncManager.getLastUpdate());
      toast.info("Données synchronisées depuis un autre onglet");
    });

    return cleanup;
  }, []);

  const handleExport = () => {
    try {
      dataSync.downloadData();
      syncManager.notifyDataChange();
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
        syncManager.notifyDataChange();
        toast.success("Données importées avec succès - Rechargez la page");
        setStats(dataSync.getStats());
        setTimeout(() => window.location.reload(), 1500);
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

  const generateCode = () => {
    const code = syncManager.generateSyncCode();
    if (code) {
      setSyncCode(code);
      toast.success("Code de synchronisation généré");
    } else {
      toast.error("Erreur lors de la génération");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(syncCode);
    toast.success("Code copié dans le presse-papiers");
  };

  const applyCode = () => {
    if (!inputCode.trim()) {
      toast.error("Veuillez coller un code de synchronisation");
      return;
    }

    const success = syncManager.applySyncCode(inputCode.trim(), mergeMode);
    if (success) {
      toast.success("Synchronisation réussie - Rechargement...");
      setTimeout(() => window.location.reload(), 1500);
    } else {
      toast.error("Code invalide ou erreur de synchronisation");
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
      <DialogContent className="glass-effect border-primary/30 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 glow-text">
            <Wifi className="w-5 h-5" />
            Synchronisation multi-appareils
          </DialogTitle>
          <DialogDescription>
            Synchronisez vos données entre tous les appareils de votre réseau local sans serveur externe.
          </DialogDescription>
        </DialogHeader>

        {lastUpdate && (
          <Badge variant="outline" className="w-fit text-xs">
            Dernière sync: {new Date(lastUpdate).toLocaleString("fr-FR")}
          </Badge>
        )}

        <Tabs defaultValue="code" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code">
              <QrCode className="w-4 h-4 mr-2" />
              Code Sync
            </TabsTrigger>
            <TabsTrigger value="file">
              <HardDrive className="w-4 h-4 mr-2" />
              Fichier
            </TabsTrigger>
          </TabsList>

          {/* Code Sync Tab */}
          <TabsContent value="code" className="space-y-4 mt-4">
            <Card className="bg-secondary/30 border-border/30">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" />
                  Envoyer mes données
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Générez un code et partagez-le sur l'autre appareil.
                </p>
                <Button onClick={generateCode} variant="gradient" className="w-full gap-2">
                  Générer code de sync
                </Button>
                {syncCode && (
                  <div className="space-y-2">
                    <Textarea 
                      value={syncCode} 
                      readOnly 
                      className="text-xs font-mono h-20 bg-background/50"
                    />
                    <Button onClick={copyCode} variant="outline" size="sm" className="w-full gap-2">
                      <Copy className="w-3 h-3" />
                      Copier le code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-secondary/30 border-border/30">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4 text-accent" />
                  Recevoir des données
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Collez le code reçu d'un autre appareil.
                </p>
                <Textarea 
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Collez le code de synchronisation ici..."
                  className="text-xs font-mono h-20 bg-background/50"
                />
                
                {/* Merge Mode */}
                <div className="space-y-2">
                  <Label className="text-xs">Mode:</Label>
                  <RadioGroup value={mergeMode} onValueChange={(v) => setMergeMode(v as "replace" | "merge")} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="merge" id="merge-code" />
                      <Label htmlFor="merge-code" className="text-xs">Fusionner</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="replace" id="replace-code" />
                      <Label htmlFor="replace-code" className="text-xs">Remplacer</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Button onClick={applyCode} className="w-full gap-2" disabled={!inputCode.trim()}>
                  <Check className="w-4 h-4" />
                  Appliquer la synchronisation
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* File Tab */}
          <TabsContent value="file" className="space-y-4 mt-4">
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
                    <p className="text-muted-foreground">Users</p>
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
              Exporter en fichier JSON
            </Button>

            {/* Import Options */}
            <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border/30">
              <Label className="text-sm font-medium">Mode d'import</Label>
              <RadioGroup value={mergeMode} onValueChange={(v) => setMergeMode(v as "replace" | "merge")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="merge" id="merge-file" />
                  <Label htmlFor="merge-file" className="text-sm">Fusionner (garder les deux)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="replace" id="replace-file" />
                  <Label htmlFor="replace-file" className="text-sm">Remplacer (écraser)</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Import Button */}
            <Button 
              onClick={handleImportClick} 
              variant="outline" 
              className="w-full gap-2"
              disabled={isImporting}
            >
              <Upload className="w-4 h-4" />
              {isImporting ? "Importation..." : "Importer fichier JSON"}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </TabsContent>
        </Tabs>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-primary">💡 Astuce:</strong> Pour synchroniser automatiquement, 
            placez le fichier JSON exporté dans un dossier partagé sur votre réseau (ex: NAS, dossier partagé Windows).
            Tous les appareils peuvent alors importer depuis le même fichier.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
