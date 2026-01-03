import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function RequestConjugationForm() {
  const { t } = useLanguage();
  const [infinitive, setInfinitive] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!infinitive.trim()) {
      toast.error(t.request_fill_verb);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t.request_login_required);
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

      toast.success(t.request_success);
      setInfinitive("");
      setNotes("");
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error(t.request_error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          {t.request_title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="infinitive">{t.request_verb_label}</Label>
            <Input
              id="infinitive"
              value={infinitive}
              onChange={(e) => setInfinitive(e.target.value)}
              placeholder={t.request_verb_placeholder}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t.request_notes_label}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.request_notes_placeholder}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.request_submitting}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t.request_submit}
              </>
            )}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-4">
          {t.request_info}
        </p>
      </CardContent>
    </Card>
  );
}
