import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check, X, Share2, Trash2, MessageSquare, Pencil, Tag, Plus } from "lucide-react";
import { getThemes, addTheme, updateTheme, deleteTheme, Theme } from "@/lib/api";

const NIVEAU_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

interface ConjugationRequest {
  id: string;
  infinitive: string;
  notes: string | null;
  status: string;
  created_at: string;
}

interface UserWord {
  id: string;
  source_word: string;
  translation: string;
  source_language: string;
  target_language: string;
  shared: string;
  user_id: string | null;
  word_type: string | null;
  niveau: string | null;
  thema?: string | null;
  theme_id: string | null;
  context: string | null;
}

export function AdminDashboard() {
  const [requests, setRequests] = useState<ConjugationRequest[]>([]);
  const [userWords, setUserWords] = useState<UserWord[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingWord, setEditingWord] = useState<UserWord | null>(null);
  const [editForm, setEditForm] = useState({
    source_word: "",
    translation: "",
    word_type: "",
    niveau: "",
    thema: "",
    context: ""
  });
  const [niveauPromptWord, setNiveauPromptWord] = useState<UserWord | null>(null);
  const [selectedNiveau, setSelectedNiveau] = useState("");
  
  // Theme management state
  const [newThemeName, setNewThemeName] = useState("");
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [editThemeName, setEditThemeName] = useState("");
  const [isAddingTheme, setIsAddingTheme] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch themes FIRST so we can map them to words
      const themesData = await getThemes();
      setThemes(themesData);

      // Fetch pending conjugation requests
      const { data: requestsData, error: requestsError } = await supabase
        .from("conjugation_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;
      setRequests(requestsData || []);

      // Fetch user-added words via words_secure view (includes admin access to all words)
      const { data: wordsData, error: wordsError } = await supabase
        .from("words_secure")
        .select("*")
        .eq("shared", "No")
        .not("user_id", "is", null)
        .order("created_at", { ascending: false });

      if (wordsError) throw wordsError;
      // Map words to include thema from themes (use themesData, not stale state)
      const wordsWithThema = (wordsData || []).map(w => ({
        ...w,
        thema: themesData.find(t => t.id === w.theme_id)?.name || null,
      })) as UserWord[];
      setUserWords(wordsWithThema);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Kon gegevens niet laden");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestStatus = async (id: string, status: "approved" | "rejected") => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from("conjugation_requests")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast.success(status === "approved" ? "Verzoek goedgekeurd" : "Verzoek afgewezen");
      setRequests(requests.filter(r => r.id !== id));
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Kon verzoek niet bijwerken");
    } finally {
      setProcessingId(null);
    }
  };

  const handleMakeShared = async (wordId: string, niveau?: string) => {
    const word = userWords.find(w => w.id === wordId);
    if (!word) return;

    // If niveau is not provided and word doesn't have one, prompt for it
    const finalNiveau = niveau || word.niveau;
    if (!finalNiveau) {
      setNiveauPromptWord(word);
      setSelectedNiveau("");
      return;
    }

    setProcessingId(wordId);
    try {
      const { data, error, count } = await supabase
        .from("words")
        .update({ 
          shared: "Yes",
          source_word: word.source_word.toLowerCase(),
          translation: word.translation.toLowerCase(),
          niveau: finalNiveau
        })
        .eq("id", wordId)
        .select();

      console.log("Update result:", { data, error, count, wordId });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error("No rows updated - RLS policy may be blocking the update");
        toast.error("Update mislukt - geen rechten om dit woord bij te werken");
        return;
      }

      toast.success("Woord goedgekeurd en beschikbaar voor iedereen");
      setUserWords(userWords.filter(w => w.id !== wordId));
    } catch (error) {
      console.error("Error making word shared:", error);
      toast.error("Kon woord niet goedkeuren");
    } finally {
      setProcessingId(null);
    }
  };

  const handleNiveauPromptConfirm = () => {
    if (!niveauPromptWord || !selectedNiveau) return;
    handleMakeShared(niveauPromptWord.id, selectedNiveau);
    setNiveauPromptWord(null);
    setSelectedNiveau("");
  };

  const handleDeleteWord = async (wordId: string) => {
    setProcessingId(wordId);
    try {
      const { error } = await supabase
        .from("words")
        .delete()
        .eq("id", wordId);

      if (error) throw error;

      toast.success("Woord afgewezen en verwijderd");
      setUserWords(userWords.filter(w => w.id !== wordId));
    } catch (error) {
      console.error("Error deleting word:", error);
      toast.error("Kon woord niet verwijderen");
    } finally {
      setProcessingId(null);
    }
  };

  const openEditDialog = (word: UserWord) => {
    setEditingWord(word);
    setEditForm({
      source_word: word.source_word,
      translation: word.translation,
      word_type: word.word_type || "",
      niveau: word.niveau || "",
      thema: word.thema || "",
      context: word.context || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editingWord) return;
    
    setProcessingId(editingWord.id);
    try {
      // Find theme_id if thema is selected
      const selectedTheme = themes.find(t => t.name === editForm.thema);
      
      const { error } = await supabase
        .from("words")
        .update({
          source_word: editForm.source_word,
          translation: editForm.translation,
          word_type: editForm.word_type || null,
          niveau: editForm.niveau || null,
          theme_id: selectedTheme?.id || null,
          context: editForm.context || null
        })
        .eq("id", editingWord.id);

      if (error) throw error;

      toast.success("Woord bijgewerkt");
      setUserWords(userWords.map(w => 
        w.id === editingWord.id 
          ? { ...w, ...editForm }
          : w
      ));
      setEditingWord(null);
    } catch (error) {
      console.error("Error updating word:", error);
      toast.error("Kon woord niet bijwerken");
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveAfterEdit = async () => {
    if (!editingWord) return;
    
    // If niveau is not filled, prompt for it
    if (!editForm.niveau) {
      toast.error("Selecteer eerst een niveau");
      return;
    }
    
    setProcessingId(editingWord.id);
    try {
      // Find theme_id if thema is selected
      const selectedTheme = themes.find(t => t.name === editForm.thema);
      
      const { error } = await supabase
        .from("words")
        .update({
          source_word: editForm.source_word.toLowerCase(),
          translation: editForm.translation.toLowerCase(),
          word_type: editForm.word_type ? editForm.word_type.toLowerCase() : null,
          niveau: editForm.niveau,
          theme_id: selectedTheme?.id || null,
          context: editForm.context || null,
          shared: "Yes"
        })
        .eq("id", editingWord.id);

      if (error) throw error;

      toast.success("Woord bijgewerkt en goedgekeurd");
      setUserWords(userWords.filter(w => w.id !== editingWord.id));
      setEditingWord(null);
    } catch (error) {
      console.error("Error updating word:", error);
      toast.error("Kon woord niet bijwerken");
    } finally {
      setProcessingId(null);
    }
  };

  // Theme management handlers
  const handleAddTheme = async () => {
    if (!newThemeName.trim()) return;
    
    setIsAddingTheme(true);
    try {
      const newTheme = await addTheme(newThemeName.trim());
      setThemes([...themes, newTheme].sort((a, b) => a.name.localeCompare(b.name)));
      setNewThemeName("");
      toast.success("Thema toegevoegd");
    } catch (error: any) {
      toast.error(error.message || "Kon thema niet toevoegen");
    } finally {
      setIsAddingTheme(false);
    }
  };

  const handleUpdateTheme = async () => {
    if (!editingTheme || !editThemeName.trim()) return;
    
    setProcessingId(editingTheme.id);
    try {
      const updated = await updateTheme(editingTheme.id, editThemeName.trim());
      setThemes(themes.map(t => t.id === updated.id ? updated : t).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingTheme(null);
      setEditThemeName("");
      toast.success("Thema bijgewerkt");
    } catch (error: any) {
      toast.error(error.message || "Kon thema niet bijwerken");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteTheme = async (id: string) => {
    setProcessingId(id);
    try {
      await deleteTheme(id);
      setThemes(themes.filter(t => t.id !== id));
      toast.success("Thema verwijderd");
    } catch (error: any) {
      toast.error(error.message || "Kon thema niet verwijderen");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="requests">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="requests" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Verzoeken ({requests.length})
              </TabsTrigger>
              <TabsTrigger value="words" className="gap-2">
                <Share2 className="h-4 w-4" />
                Woorden ({userWords.length})
              </TabsTrigger>
              <TabsTrigger value="themes" className="gap-2">
                <Tag className="h-4 w-4" />
                Thema's ({themes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="mt-4 space-y-3">
              {requests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Geen openstaande verzoeken
                </p>
              ) : (
                requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{request.infinitive}</p>
                      {request.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{request.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(request.created_at).toLocaleDateString("nl-NL")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestStatus(request.id, "approved")}
                        disabled={processingId === request.id}
                      >
                        {processingId === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestStatus(request.id, "rejected")}
                        disabled={processingId === request.id}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="words" className="mt-4 space-y-3">
              {userWords.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Geen gebruiker-toegevoegde woorden
                </p>
              ) : (
                userWords.map((word) => (
                  <div
                    key={word.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{word.source_word}</p>
                      <p className="text-sm text-muted-foreground">{word.translation}</p>
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        {word.word_type && <span className="bg-secondary px-2 py-0.5 rounded">{word.word_type}</span>}
                        {word.niveau && <span className="bg-secondary px-2 py-0.5 rounded">{word.niveau}</span>}
                        {word.thema && <span className="bg-secondary px-2 py-0.5 rounded">{word.thema}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(word)}
                        disabled={processingId === word.id}
                        title="Bewerken"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMakeShared(word.id)}
                        disabled={processingId === word.id}
                        title="Goedkeuren"
                        className="text-green-600 hover:text-green-700"
                      >
                        {processingId === word.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteWord(word.id)}
                        disabled={processingId === word.id}
                        className="text-destructive hover:text-destructive"
                        title="Afwijzen"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="themes" className="mt-4 space-y-4">
              {/* Add new theme */}
              <div className="flex gap-2">
                <Input
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                  placeholder="Nieuw thema toevoegen..."
                  onKeyDown={(e) => e.key === "Enter" && handleAddTheme()}
                />
                <Button
                  onClick={handleAddTheme}
                  disabled={isAddingTheme || !newThemeName.trim()}
                >
                  {isAddingTheme ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Toevoegen
                </Button>
              </div>

              {/* Theme list */}
              {themes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Geen thema's gevonden
                </p>
              ) : (
                <div className="space-y-2">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border"
                    >
                      <span className="font-medium capitalize">{theme.name}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTheme(theme);
                            setEditThemeName(theme.name);
                          }}
                          disabled={processingId === theme.id}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTheme(theme.id)}
                          disabled={processingId === theme.id}
                          className="text-destructive hover:text-destructive"
                        >
                          {processingId === theme.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit word dialog */}
      <Dialog open={!!editingWord} onOpenChange={(open) => !open && setEditingWord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Woord bewerken</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="source_word">Bronwoord</Label>
              <Input
                id="source_word"
                value={editForm.source_word}
                onChange={(e) => setEditForm({ ...editForm, source_word: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="translation">Vertaling</Label>
              <Input
                id="translation"
                value={editForm.translation}
                onChange={(e) => setEditForm({ ...editForm, translation: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="word_type">Woordsoort</Label>
              <Input
                id="word_type"
                value={editForm.word_type}
                onChange={(e) => setEditForm({ ...editForm, word_type: e.target.value })}
                placeholder="bijv. zelfstandig naamwoord"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="niveau">Niveau</Label>
              <Select
                value={editForm.niveau}
                onValueChange={(value) => setEditForm({ ...editForm, niveau: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer niveau" />
                </SelectTrigger>
                <SelectContent>
                  {NIVEAU_OPTIONS.map((niveau) => (
                    <SelectItem key={niveau} value={niveau}>
                      {niveau}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="thema">Thema</Label>
              <Select
                value={editForm.thema}
                onValueChange={(value) => setEditForm({ ...editForm, thema: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer thema" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.name}>
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="context">Context</Label>
              <Input
                id="context"
                value={editForm.context}
                onChange={(e) => setEditForm({ ...editForm, context: e.target.value })}
                placeholder="bijv. gebruikscontext of voorbeeld"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingWord(null)}
            >
              Annuleren
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveEdit}
              disabled={processingId === editingWord?.id}
            >
              Opslaan
            </Button>
            <Button
              onClick={handleApproveAfterEdit}
              disabled={processingId === editingWord?.id}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingId === editingWord?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Opslaan & Goedkeuren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Niveau prompt dialog */}
      <Dialog open={!!niveauPromptWord} onOpenChange={(open) => !open && setNiveauPromptWord(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecteer niveau</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Dit woord heeft nog geen niveau. Selecteer een niveau om door te gaan.
            </p>
            <p className="font-medium mb-2">
              {niveauPromptWord?.source_word} → {niveauPromptWord?.translation}
            </p>
            <Select
              value={selectedNiveau}
              onValueChange={setSelectedNiveau}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer niveau" />
              </SelectTrigger>
              <SelectContent>
                {NIVEAU_OPTIONS.map((niveau) => (
                  <SelectItem key={niveau} value={niveau}>
                    {niveau}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNiveauPromptWord(null)}
            >
              Annuleren
            </Button>
            <Button
              onClick={handleNiveauPromptConfirm}
              disabled={!selectedNiveau}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Goedkeuren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit theme dialog */}
      <Dialog open={!!editingTheme} onOpenChange={(open) => !open && setEditingTheme(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thema bewerken</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit_theme_name">Thema naam</Label>
            <Input
              id="edit_theme_name"
              value={editThemeName}
              onChange={(e) => setEditThemeName(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingTheme(null)}
            >
              Annuleren
            </Button>
            <Button
              onClick={handleUpdateTheme}
              disabled={processingId === editingTheme?.id || !editThemeName.trim()}
            >
              {processingId === editingTheme?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
