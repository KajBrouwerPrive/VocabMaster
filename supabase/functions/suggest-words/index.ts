import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sourceLanguage, targetLanguage, category, count = 10 } = await req.json();
    
    console.log(`Suggesting ${count} ${category || 'common'} words from ${sourceLanguage} to ${targetLanguage}`);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Create Supabase client to check existing words
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Get existing words to avoid duplicates
    const { data: existingWords } = await supabase
      .from('words')
      .select('source_word')
      .eq('source_language', sourceLanguage)
      .eq('target_language', targetLanguage);
    
    const existingWordList = existingWords?.map(w => w.source_word.toLowerCase()) || [];
    console.log(`Found ${existingWordList.length} existing words to exclude`);

    const categoryPrompt = category 
      ? `from the category "${category}"` 
      : 'that are commonly used in daily life';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a language learning assistant. Generate vocabulary words in ${sourceLanguage} ${categoryPrompt} with their translations to ${targetLanguage}. 
            
IMPORTANT: Do NOT include any of these words: ${existingWordList.join(', ')}

Return ONLY a JSON array with objects containing "word" (in ${sourceLanguage}) and "translation" (in ${targetLanguage}).
Example format: [{"word": "huis", "translation": "house"}, {"word": "auto", "translation": "car"}]
Return ONLY the JSON array, no other text.`
          },
          {
            role: 'user',
            content: `Generate ${count} vocabulary words.`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Te veel verzoeken, probeer het later opnieuw.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Credits op, voeg credits toe aan je workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim();
    
    // Parse JSON from response (handle markdown code blocks)
    if (content.startsWith('```')) {
      content = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }
    
    const suggestions = JSON.parse(content);
    
    // Filter out any duplicates that slipped through
    const filteredSuggestions = suggestions.filter(
      (s: { word: string }) => !existingWordList.includes(s.word.toLowerCase())
    );
    
    console.log(`Generated ${filteredSuggestions.length} unique word suggestions`);

    return new Response(JSON.stringify({ suggestions: filteredSuggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in suggest-words:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
