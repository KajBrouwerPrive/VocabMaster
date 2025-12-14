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
      user_conjugation_progress: {
        Row: {
          conjugation_id: string
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
          created_at: string
          id: string
          infinitive: string
          past_hij_zij: string
          past_ik: string
          past_jij: string
          past_jullie: string
          past_wij: string
          perfect_hij_zij: string
          perfect_ik: string
          perfect_jij: string
          perfect_jullie: string
          perfect_wij: string
          present_hij_zij: string
          present_ik: string
          present_jij: string
          present_jullie: string
          present_wij: string
          shared: string
          source_language: string
          target_language: string
          translation: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          infinitive: string
          past_hij_zij: string
          past_ik: string
          past_jij: string
          past_jullie: string
          past_wij: string
          perfect_hij_zij: string
          perfect_ik: string
          perfect_jij: string
          perfect_jullie: string
          perfect_wij: string
          present_hij_zij: string
          present_ik: string
          present_jij: string
          present_jullie: string
          present_wij: string
          shared?: string
          source_language?: string
          target_language?: string
          translation: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          infinitive?: string
          past_hij_zij?: string
          past_ik?: string
          past_jij?: string
          past_jullie?: string
          past_wij?: string
          perfect_hij_zij?: string
          perfect_ik?: string
          perfect_jij?: string
          perfect_jullie?: string
          perfect_wij?: string
          present_hij_zij?: string
          present_ik?: string
          present_jij?: string
          present_jullie?: string
          present_wij?: string
          shared?: string
          source_language?: string
          target_language?: string
          translation?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      words: {
        Row: {
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
          user_id: string | null
          view_count: number
          word_type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          incorrect_count?: number
          quiz_view_count?: number
          seen?: boolean
          shared?: string
          source_language?: string
          source_word: string
          target_language: string
          translation: string
          updated_at?: string
          user_id?: string | null
          view_count?: number
          word_type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          incorrect_count?: number
          quiz_view_count?: number
          seen?: boolean
          shared?: string
          source_language?: string
          source_word?: string
          target_language?: string
          translation?: string
          updated_at?: string
          user_id?: string | null
          view_count?: number
          word_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      words_secure: {
        Row: {
          created_at: string | null
          id: string | null
          incorrect_count: number | null
          quiz_view_count: number | null
          seen: boolean | null
          shared: string | null
          source_language: string | null
          source_word: string | null
          target_language: string | null
          translation: string | null
          updated_at: string | null
          user_id: string | null
          view_count: number | null
          word_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          incorrect_count?: number | null
          quiz_view_count?: number | null
          seen?: boolean | null
          shared?: string | null
          source_language?: string | null
          source_word?: string | null
          target_language?: string | null
          translation?: string | null
          updated_at?: string | null
          user_id?: never
          view_count?: number | null
          word_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          incorrect_count?: number | null
          quiz_view_count?: number | null
          seen?: boolean | null
          shared?: string | null
          source_language?: string | null
          source_word?: string | null
          target_language?: string | null
          translation?: string | null
          updated_at?: string | null
          user_id?: never
          view_count?: number | null
          word_type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
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
