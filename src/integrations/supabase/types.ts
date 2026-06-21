export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      conjugation_requests: {
        Row: {
          created_at: string
          id: string
          infinitive: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          infinitive: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          infinitive?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          correct_answers: number
          created_at: string
          duration_seconds: number | null
          id: string
          ignore_accents: boolean | null
          niveau: string | null
          quiz_type: string
          score_percentage: number
          tenses: string[] | null
          thema: string | null
          total_questions: number
          user_id: string
        }
        Insert: {
          correct_answers: number
          created_at?: string
          duration_seconds?: number | null
          id?: string
          ignore_accents?: boolean | null
          niveau?: string | null
          quiz_type: string
          score_percentage: number
          tenses?: string[] | null
          thema?: string | null
          total_questions: number
          user_id: string
        }
        Update: {
          correct_answers?: number
          created_at?: string
          duration_seconds?: number | null
          id?: string
          ignore_accents?: boolean | null
          niveau?: string | null
          quiz_type?: string
          score_percentage?: number
          tenses?: string[] | null
          thema?: string | null
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      themes: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_conjugation_progress: {
        Row: {
          conjugation_id: string
          correct_count: number
          created_at: string
          id: string
          incorrect_count: number
          quiz_view_count: number
          seen: boolean
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          conjugation_id: string
          correct_count?: number
          created_at?: string
          id?: string
          incorrect_count?: number
          quiz_view_count?: number
          seen?: boolean
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          conjugation_id?: string
          correct_count?: number
          created_at?: string
          id?: string
          incorrect_count?: number
          quiz_view_count?: number
          seen?: boolean
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_conjugation_progress_conjugation_id_fkey"
            columns: ["conjugation_id"]
            isOneToOne: false
            referencedRelation: "verb_conjugations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_conjugation_progress_conjugation_id_fkey"
            columns: ["conjugation_id"]
            isOneToOne: false
            referencedRelation: "verb_conjugations_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      user_conjugation_tense_progress: {
        Row: {
          conjugation_id: string
          created_at: string
          id: string
          seen: boolean
          tense: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conjugation_id: string
          created_at?: string
          id?: string
          seen?: boolean
          tense: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conjugation_id?: string
          created_at?: string
          id?: string
          seen?: boolean
          tense?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_conjugation_tense_progress_conjugation_id_fkey"
            columns: ["conjugation_id"]
            isOneToOne: false
            referencedRelation: "verb_conjugations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_conjugation_tense_progress_conjugation_id_fkey"
            columns: ["conjugation_id"]
            isOneToOne: false
            referencedRelation: "verb_conjugations_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_word_progress: {
        Row: {
          correct_count: number
          created_at: string
          id: string
          incorrect_count: number
          quiz_view_count: number
          seen: boolean
          updated_at: string
          user_id: string
          view_count: number
          word_id: string
        }
        Insert: {
          correct_count?: number
          created_at?: string
          id?: string
          incorrect_count?: number
          quiz_view_count?: number
          seen?: boolean
          updated_at?: string
          user_id: string
          view_count?: number
          word_id: string
        }
        Update: {
          correct_count?: number
          created_at?: string
          id?: string
          incorrect_count?: number
          quiz_view_count?: number
          seen?: boolean
          updated_at?: string
          user_id?: string
          view_count?: number
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_word_progress_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_word_progress_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      verb_conjugations: {
        Row: {
          condicional_hij_zij: string
          condicional_ik: string
          condicional_jij: string
          condicional_jullie: string
          condicional_wij: string
          condicional_zij: string
          created_at: string
          futuro_hij_zij: string
          futuro_ik: string
          futuro_jij: string
          futuro_jullie: string
          futuro_perfecto_hij_zij: string
          futuro_perfecto_ik: string
          futuro_perfecto_jij: string
          futuro_perfecto_jullie: string
          futuro_perfecto_wij: string
          futuro_perfecto_zij: string
          futuro_wij: string
          futuro_zij: string
          id: string
          indefinido_hij_zij: string
          indefinido_ik: string
          indefinido_jij: string
          indefinido_jullie: string
          indefinido_wij: string
          indefinido_zij: string
          infinitive: string
          past_hij_zij: string
          past_ik: string
          past_jij: string
          past_jullie: string
          past_wij: string
          past_zij: string
          perfect_hij_zij: string
          perfect_ik: string
          perfect_jij: string
          perfect_jullie: string
          perfect_wij: string
          perfect_zij: string
          pluscuamperfecto_hij_zij: string
          pluscuamperfecto_ik: string
          pluscuamperfecto_jij: string
          pluscuamperfecto_jullie: string
          pluscuamperfecto_wij: string
          pluscuamperfecto_zij: string
          present_hij_zij: string
          present_ik: string
          present_jij: string
          present_jullie: string
          present_wij: string
          present_zij: string
          shared: string
          source_language: string
          subjuntivo_imperfecto_hij_zij: string
          subjuntivo_imperfecto_ik: string
          subjuntivo_imperfecto_jij: string
          subjuntivo_imperfecto_jullie: string
          subjuntivo_imperfecto_wij: string
          subjuntivo_imperfecto_zij: string
          subjuntivo_presente_hij_zij: string
          subjuntivo_presente_ik: string
          subjuntivo_presente_jij: string
          subjuntivo_presente_jullie: string
          subjuntivo_presente_wij: string
          subjuntivo_presente_zij: string
          target_language: string
          translation: string
          updated_at: string
          user_id: string | null
          verb_type: string
        }
        Insert: {
          condicional_hij_zij?: string
          condicional_ik?: string
          condicional_jij?: string
          condicional_jullie?: string
          condicional_wij?: string
          condicional_zij?: string
          created_at?: string
          futuro_hij_zij?: string
          futuro_ik?: string
          futuro_jij?: string
          futuro_jullie?: string
          futuro_perfecto_hij_zij?: string
          futuro_perfecto_ik?: string
          futuro_perfecto_jij?: string
          futuro_perfecto_jullie?: string
          futuro_perfecto_wij?: string
          futuro_perfecto_zij?: string
          futuro_wij?: string
          futuro_zij?: string
          id?: string
          indefinido_hij_zij?: string
          indefinido_ik?: string
          indefinido_jij?: string
          indefinido_jullie?: string
          indefinido_wij?: string
          indefinido_zij?: string
          infinitive: string
          past_hij_zij: string
          past_ik: string
          past_jij: string
          past_jullie: string
          past_wij: string
          past_zij?: string
          perfect_hij_zij: string
          perfect_ik: string
          perfect_jij: string
          perfect_jullie: string
          perfect_wij: string
          perfect_zij?: string
          pluscuamperfecto_hij_zij?: string
          pluscuamperfecto_ik?: string
          pluscuamperfecto_jij?: string
          pluscuamperfecto_jullie?: string
          pluscuamperfecto_wij?: string
          pluscuamperfecto_zij?: string
          present_hij_zij: string
          present_ik: string
          present_jij: string
          present_jullie: string
          present_wij: string
          present_zij?: string
          shared?: string
          source_language?: string
          subjuntivo_imperfecto_hij_zij?: string
          subjuntivo_imperfecto_ik?: string
          subjuntivo_imperfecto_jij?: string
          subjuntivo_imperfecto_jullie?: string
          subjuntivo_imperfecto_wij?: string
          subjuntivo_imperfecto_zij?: string
          subjuntivo_presente_hij_zij?: string
          subjuntivo_presente_ik?: string
          subjuntivo_presente_jij?: string
          subjuntivo_presente_jullie?: string
          subjuntivo_presente_wij?: string
          subjuntivo_presente_zij?: string
          target_language?: string
          translation: string
          updated_at?: string
          user_id?: string | null
          verb_type?: string
        }
        Update: {
          condicional_hij_zij?: string
          condicional_ik?: string
          condicional_jij?: string
          condicional_jullie?: string
          condicional_wij?: string
          condicional_zij?: string
          created_at?: string
          futuro_hij_zij?: string
          futuro_ik?: string
          futuro_jij?: string
          futuro_jullie?: string
          futuro_perfecto_hij_zij?: string
          futuro_perfecto_ik?: string
          futuro_perfecto_jij?: string
          futuro_perfecto_jullie?: string
          futuro_perfecto_wij?: string
          futuro_perfecto_zij?: string
          futuro_wij?: string
          futuro_zij?: string
          id?: string
          indefinido_hij_zij?: string
          indefinido_ik?: string
          indefinido_jij?: string
          indefinido_jullie?: string
          indefinido_wij?: string
          indefinido_zij?: string
          infinitive?: string
          past_hij_zij?: string
          past_ik?: string
          past_jij?: string
          past_jullie?: string
          past_wij?: string
          past_zij?: string
          perfect_hij_zij?: string
          perfect_ik?: string
          perfect_jij?: string
          perfect_jullie?: string
          perfect_wij?: string
          perfect_zij?: string
          pluscuamperfecto_hij_zij?: string
          pluscuamperfecto_ik?: string
          pluscuamperfecto_jij?: string
          pluscuamperfecto_jullie?: string
          pluscuamperfecto_wij?: string
          pluscuamperfecto_zij?: string
          present_hij_zij?: string
          present_ik?: string
          present_jij?: string
          present_jullie?: string
          present_wij?: string
          present_zij?: string
          shared?: string
          source_language?: string
          subjuntivo_imperfecto_hij_zij?: string
          subjuntivo_imperfecto_ik?: string
          subjuntivo_imperfecto_jij?: string
          subjuntivo_imperfecto_jullie?: string
          subjuntivo_imperfecto_wij?: string
          subjuntivo_imperfecto_zij?: string
          subjuntivo_presente_hij_zij?: string
          subjuntivo_presente_ik?: string
          subjuntivo_presente_jij?: string
          subjuntivo_presente_jullie?: string
          subjuntivo_presente_wij?: string
          subjuntivo_presente_zij?: string
          target_language?: string
          translation?: string
          updated_at?: string
          user_id?: string | null
          verb_type?: string
        }
        Relationships: []
      }
      words: {
        Row: {
          context: string | null
          created_at: string
          id: string
          incorrect_count: number
          niveau: string | null
          quiz_view_count: number
          seen: boolean
          shared: string
          source_language: string
          source_word: string
          target_language: string
          theme_id: string | null
          translation: string
          updated_at: string
          user_id: string | null
          view_count: number
          word_type: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          incorrect_count?: number
          niveau?: string | null
          quiz_view_count?: number
          seen?: boolean
          shared?: string
          source_language?: string
          source_word: string
          target_language: string
          theme_id?: string | null
          translation: string
          updated_at?: string
          user_id?: string | null
          view_count?: number
          word_type?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          incorrect_count?: number
          niveau?: string | null
          quiz_view_count?: number
          seen?: boolean
          shared?: string
          source_language?: string
          source_word?: string
          target_language?: string
          theme_id?: string | null
          translation?: string
          updated_at?: string
          user_id?: string | null
          view_count?: number
          word_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "words_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      verb_conjugations_secure: {
        Row: {
          condicional_hij_zij: string | null
          condicional_ik: string | null
          condicional_jij: string | null
          condicional_jullie: string | null
          condicional_wij: string | null
          condicional_zij: string | null
          created_at: string | null
          futuro_hij_zij: string | null
          futuro_ik: string | null
          futuro_jij: string | null
          futuro_jullie: string | null
          futuro_perfecto_hij_zij: string | null
          futuro_perfecto_ik: string | null
          futuro_perfecto_jij: string | null
          futuro_perfecto_jullie: string | null
          futuro_perfecto_wij: string | null
          futuro_perfecto_zij: string | null
          futuro_wij: string | null
          futuro_zij: string | null
          id: string | null
          indefinido_hij_zij: string | null
          indefinido_ik: string | null
          indefinido_jij: string | null
          indefinido_jullie: string | null
          indefinido_wij: string | null
          indefinido_zij: string | null
          infinitive: string | null
          past_hij_zij: string | null
          past_ik: string | null
          past_jij: string | null
          past_jullie: string | null
          past_wij: string | null
          past_zij: string | null
          perfect_hij_zij: string | null
          perfect_ik: string | null
          perfect_jij: string | null
          perfect_jullie: string | null
          perfect_wij: string | null
          perfect_zij: string | null
          pluscuamperfecto_hij_zij: string | null
          pluscuamperfecto_ik: string | null
          pluscuamperfecto_jij: string | null
          pluscuamperfecto_jullie: string | null
          pluscuamperfecto_wij: string | null
          pluscuamperfecto_zij: string | null
          present_hij_zij: string | null
          present_ik: string | null
          present_jij: string | null
          present_jullie: string | null
          present_wij: string | null
          present_zij: string | null
          shared: string | null
          source_language: string | null
          subjuntivo_imperfecto_hij_zij: string | null
          subjuntivo_imperfecto_ik: string | null
          subjuntivo_imperfecto_jij: string | null
          subjuntivo_imperfecto_jullie: string | null
          subjuntivo_imperfecto_wij: string | null
          subjuntivo_imperfecto_zij: string | null
          subjuntivo_presente_hij_zij: string | null
          subjuntivo_presente_ik: string | null
          subjuntivo_presente_jij: string | null
          subjuntivo_presente_jullie: string | null
          subjuntivo_presente_wij: string | null
          subjuntivo_presente_zij: string | null
          target_language: string | null
          translation: string | null
          updated_at: string | null
          user_id: string | null
          verb_type: string | null
        }
        Insert: {
          condicional_hij_zij?: string | null
          condicional_ik?: string | null
          condicional_jij?: string | null
          condicional_jullie?: string | null
          condicional_wij?: string | null
          condicional_zij?: string | null
          created_at?: string | null
          futuro_hij_zij?: string | null
          futuro_ik?: string | null
          futuro_jij?: string | null
          futuro_jullie?: string | null
          futuro_perfecto_hij_zij?: string | null
          futuro_perfecto_ik?: string | null
          futuro_perfecto_jij?: string | null
          futuro_perfecto_jullie?: string | null
          futuro_perfecto_wij?: string | null
          futuro_perfecto_zij?: string | null
          futuro_wij?: string | null
          futuro_zij?: string | null
          id?: string | null
          indefinido_hij_zij?: string | null
          indefinido_ik?: string | null
          indefinido_jij?: string | null
          indefinido_jullie?: string | null
          indefinido_wij?: string | null
          indefinido_zij?: string | null
          infinitive?: string | null
          past_hij_zij?: string | null
          past_ik?: string | null
          past_jij?: string | null
          past_jullie?: string | null
          past_wij?: string | null
          past_zij?: string | null
          perfect_hij_zij?: string | null
          perfect_ik?: string | null
          perfect_jij?: string | null
          perfect_jullie?: string | null
          perfect_wij?: string | null
          perfect_zij?: string | null
          pluscuamperfecto_hij_zij?: string | null
          pluscuamperfecto_ik?: string | null
          pluscuamperfecto_jij?: string | null
          pluscuamperfecto_jullie?: string | null
          pluscuamperfecto_wij?: string | null
          pluscuamperfecto_zij?: string | null
          present_hij_zij?: string | null
          present_ik?: string | null
          present_jij?: string | null
          present_jullie?: string | null
          present_wij?: string | null
          present_zij?: string | null
          shared?: string | null
          source_language?: string | null
          subjuntivo_imperfecto_hij_zij?: string | null
          subjuntivo_imperfecto_ik?: string | null
          subjuntivo_imperfecto_jij?: string | null
          subjuntivo_imperfecto_jullie?: string | null
          subjuntivo_imperfecto_wij?: string | null
          subjuntivo_imperfecto_zij?: string | null
          subjuntivo_presente_hij_zij?: string | null
          subjuntivo_presente_ik?: string | null
          subjuntivo_presente_jij?: string | null
          subjuntivo_presente_jullie?: string | null
          subjuntivo_presente_wij?: string | null
          subjuntivo_presente_zij?: string | null
          target_language?: string | null
          translation?: string | null
          updated_at?: string | null
          user_id?: never
          verb_type?: string | null
        }
        Update: {
          condicional_hij_zij?: string | null
          condicional_ik?: string | null
          condicional_jij?: string | null
          condicional_jullie?: string | null
          condicional_wij?: string | null
          condicional_zij?: string | null
          created_at?: string | null
          futuro_hij_zij?: string | null
          futuro_ik?: string | null
          futuro_jij?: string | null
          futuro_jullie?: string | null
          futuro_perfecto_hij_zij?: string | null
          futuro_perfecto_ik?: string | null
          futuro_perfecto_jij?: string | null
          futuro_perfecto_jullie?: string | null
          futuro_perfecto_wij?: string | null
          futuro_perfecto_zij?: string | null
          futuro_wij?: string | null
          futuro_zij?: string | null
          id?: string | null
          indefinido_hij_zij?: string | null
          indefinido_ik?: string | null
          indefinido_jij?: string | null
          indefinido_jullie?: string | null
          indefinido_wij?: string | null
          indefinido_zij?: string | null
          infinitive?: string | null
          past_hij_zij?: string | null
          past_ik?: string | null
          past_jij?: string | null
          past_jullie?: string | null
          past_wij?: string | null
          past_zij?: string | null
          perfect_hij_zij?: string | null
          perfect_ik?: string | null
          perfect_jij?: string | null
          perfect_jullie?: string | null
          perfect_wij?: string | null
          perfect_zij?: string | null
          pluscuamperfecto_hij_zij?: string | null
          pluscuamperfecto_ik?: string | null
          pluscuamperfecto_jij?: string | null
          pluscuamperfecto_jullie?: string | null
          pluscuamperfecto_wij?: string | null
          pluscuamperfecto_zij?: string | null
          present_hij_zij?: string | null
          present_ik?: string | null
          present_jij?: string | null
          present_jullie?: string | null
          present_wij?: string | null
          present_zij?: string | null
          shared?: string | null
          source_language?: string | null
          subjuntivo_imperfecto_hij_zij?: string | null
          subjuntivo_imperfecto_ik?: string | null
          subjuntivo_imperfecto_jij?: string | null
          subjuntivo_imperfecto_jullie?: string | null
          subjuntivo_imperfecto_wij?: string | null
          subjuntivo_imperfecto_zij?: string | null
          subjuntivo_presente_hij_zij?: string | null
          subjuntivo_presente_ik?: string | null
          subjuntivo_presente_jij?: string | null
          subjuntivo_presente_jullie?: string | null
          subjuntivo_presente_wij?: string | null
          subjuntivo_presente_zij?: string | null
          target_language?: string | null
          translation?: string | null
          updated_at?: string | null
          user_id?: never
          verb_type?: string | null
        }
        Relationships: []
      }
      words_secure: {
        Row: {
          context: string | null
          created_at: string | null
          id: string | null
          incorrect_count: number | null
          niveau: string | null
          quiz_view_count: number | null
          seen: boolean | null
          shared: string | null
          source_language: string | null
          source_word: string | null
          target_language: string | null
          theme_id: string | null
          translation: string | null
          updated_at: string | null
          user_id: string | null
          view_count: number | null
          word_type: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          id?: string | null
          incorrect_count?: number | null
          niveau?: string | null
          quiz_view_count?: number | null
          seen?: boolean | null
          shared?: string | null
          source_language?: string | null
          source_word?: string | null
          target_language?: string | null
          theme_id?: string | null
          translation?: string | null
          updated_at?: string | null
          user_id?: never
          view_count?: number | null
          word_type?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string | null
          id?: string | null
          incorrect_count?: number | null
          niveau?: string | null
          quiz_view_count?: number | null
          seen?: boolean | null
          shared?: string | null
          source_language?: string | null
          source_word?: string | null
          target_language?: string | null
          theme_id?: string | null
          translation?: string | null
          updated_at?: string | null
          user_id?: never
          view_count?: number | null
          word_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "words_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_conjugations_secure: {
        Args: never
        Returns: {
          condicional_hij_zij: string
          condicional_ik: string
          condicional_jij: string
          condicional_jullie: string
          condicional_wij: string
          condicional_zij: string
          created_at: string
          futuro_hij_zij: string
          futuro_ik: string
          futuro_jij: string
          futuro_jullie: string
          futuro_perfecto_hij_zij: string
          futuro_perfecto_ik: string
          futuro_perfecto_jij: string
          futuro_perfecto_jullie: string
          futuro_perfecto_wij: string
          futuro_perfecto_zij: string
          futuro_wij: string
          futuro_zij: string
          id: string
          indefinido_hij_zij: string
          indefinido_ik: string
          indefinido_jij: string
          indefinido_jullie: string
          indefinido_wij: string
          indefinido_zij: string
          infinitive: string
          past_hij_zij: string
          past_ik: string
          past_jij: string
          past_jullie: string
          past_wij: string
          past_zij: string
          perfect_hij_zij: string
          perfect_ik: string
          perfect_jij: string
          perfect_jullie: string
          perfect_wij: string
          perfect_zij: string
          pluscuamperfecto_hij_zij: string
          pluscuamperfecto_ik: string
          pluscuamperfecto_jij: string
          pluscuamperfecto_jullie: string
          pluscuamperfecto_wij: string
          pluscuamperfecto_zij: string
          present_hij_zij: string
          present_ik: string
          present_jij: string
          present_jullie: string
          present_wij: string
          present_zij: string
          shared: string
          source_language: string
          subjuntivo_imperfecto_hij_zij: string
          subjuntivo_imperfecto_ik: string
          subjuntivo_imperfecto_jij: string
          subjuntivo_imperfecto_jullie: string
          subjuntivo_imperfecto_wij: string
          subjuntivo_imperfecto_zij: string
          subjuntivo_presente_hij_zij: string
          subjuntivo_presente_ik: string
          subjuntivo_presente_jij: string
          subjuntivo_presente_jullie: string
          subjuntivo_presente_wij: string
          subjuntivo_presente_zij: string
          target_language: string
          translation: string
          updated_at: string
          user_id: string
        }[]
      }
      get_words_secure: {
        Args: never
        Returns: {
          created_at: string
          id: string
          incorrect_count: number
          quiz_view_count: number
          seen: boolean
          shared: string
          source_language: string
          source_word: string
          target_language: string
          translation: string
          updated_at: string
          user_id: string
          view_count: number
          word_type: string
        }[]
      }
      get_words_with_shared: {
        Args: never
        Returns: {
          context: string
          created_at: string
          id: string
          incorrect_count: number
          niveau: string
          quiz_view_count: number
          seen: boolean
          shared: string
          source_language: string
          source_word: string
          target_language: string
          thema: string
          theme_id: string
          translation: string
          updated_at: string
          user_id: string
          view_count: number
          word_type: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
