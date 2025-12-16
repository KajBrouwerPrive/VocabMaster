import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

export function RequestConjugationForm() {
  const [infinitive, setInfinitive] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!infinitive.trim()) {
      toast.error("Vul een werkwoord in");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Je moet ingelogd zijn");
        return;
      }

      const { error } = await supabase
        .from("conjugation_requests")
        .insert({
          user_id: user.id,
          infinitive: infinitive.trim(),
          notes: notes.trim() || null,
        });

      if (error) throw error;

      toast.success("Verzoek ingediend!");
      setInfinitive("");
      setNotes("");
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Kon verzoek niet indienen");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Werkwoord Aanvragen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="infinitive">Werkwoord (infinitief)</Label>
            <Input
              id="infinitive"
              value={infinitive}
              onChange={(e) => setInfinitive(e.target.value)}
              placeholder="bijv. hablar, comer, vivir"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Opmerkingen (optioneel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Eventuele opmerkingen of context"
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Indienen...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Verzoek Indienen
              </>
            )}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-4">
          Je verzoek wordt beoordeeld door een beheerder. Als het werkwoord wordt toegevoegd, 
          is het voor iedereen beschikbaar.
        </p>
      </CardContent>
    </Card>
  );
}
