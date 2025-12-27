import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check, X, Share2, Trash2, MessageSquare, Pencil } from "lucide-react";

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
  thema: string | null;
}

export function AdminDashboard() {
  const [requests, setRequests] = useState<ConjugationRequest[]>([]);
  const [userWords, setUserWords] = useState<UserWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingWord, setEditingWord] = useState<UserWord | null>(null);
  const [editForm, setEditForm] = useState({
    source_word: "",
    translation: "",
    word_type: "",
    niveau: "",
    thema: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
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
      setUserWords(wordsData || []);
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

  const handleMakeShared = async (wordId: string) => {
    setProcessingId(wordId);
    try {
      const { error } = await supabase
        .from("words")
        .update({ shared: "Yes" })
        .eq("id", wordId);

      if (error) throw error;

      toast.success("Woord goedgekeurd en beschikbaar voor iedereen");
      setUserWords(userWords.filter(w => w.id !== wordId));
    } catch (error) {
      console.error("Error making word shared:", error);
      toast.error("Kon woord niet goedkeuren");
    } finally {
      setProcessingId(null);
    }
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
      thema: word.thema || ""
    });
  };

  const handleSaveEdit = async () => {
    if (!editingWord) return;
    
    setProcessingId(editingWord.id);
    try {
      const { error } = await supabase
        .from("words")
        .update({
          source_word: editForm.source_word,
          translation: editForm.translation,
          word_type: editForm.word_type || null,
          niveau: editForm.niveau || null,
          thema: editForm.thema || null
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
    
    setProcessingId(editingWord.id);
    try {
      const { error } = await supabase
        .from("words")
        .update({
          source_word: editForm.source_word,
          translation: editForm.translation,
          word_type: editForm.word_type || null,
          niveau: editForm.niveau || null,
          thema: editForm.thema || null,
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="requests" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Verzoeken ({requests.length})
              </TabsTrigger>
              <TabsTrigger value="words" className="gap-2">
                <Share2 className="h-4 w-4" />
                Gebruiker Woorden ({userWords.length})
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
          </Tabs>
        </CardContent>
      </Card>

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
              <Input
                id="niveau"
                value={editForm.niveau}
                onChange={(e) => setEditForm({ ...editForm, niveau: e.target.value })}
                placeholder="bijv. A1, B1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thema">Thema</Label>
              <Input
                id="thema"
                value={editForm.thema}
                onChange={(e) => setEditForm({ ...editForm, thema: e.target.value })}
                placeholder="bijv. eten, reizen"
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
    </>
  );
}