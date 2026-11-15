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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          att_date: string
          created_at: string
          id: string
          status: string
          telegram_id: number
        }
        Insert: {
          att_date: string
          created_at?: string
          id?: string
          status: string
          telegram_id: number
        }
        Update: {
          att_date?: string
          created_at?: string
          id?: string
          status?: string
          telegram_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "tg_users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      certificates: {
        Row: {
          created_at: string
          id: string
          issued_on: string
          score: string | null
          telegram_id: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          issued_on?: string
          score?: string | null
          telegram_id: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          issued_on?: string
          score?: string | null
          telegram_id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "tg_users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      channels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          join_code: string
          name: string
          teacher_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          join_code: string
          name: string
          teacher_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          join_code?: string
          name?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          description: string | null
          group_id: string
          id: string
          lesson_date: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_id: string
          id?: string
          lesson_date?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          group_id?: string
          id?: string
          lesson_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          sent_count: number
          text: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          sent_count?: number
          text: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          sent_count?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          lesson_id: string
          rating: number
          telegram_id: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          rating: number
          telegram_id: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          rating?: number
          telegram_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "tg_users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      scores: {
        Row: {
          answers_correct: number
          answers_total: number
          created_at: string
          id: string
          lesson_id: string | null
          note: string | null
          points: number
          scored_on: string
          telegram_id: number
        }
        Insert: {
          answers_correct?: number
          answers_total?: number
          created_at?: string
          id?: string
          lesson_id?: string | null
          note?: string | null
          points?: number
          scored_on?: string
          telegram_id: number
        }
        Update: {
          answers_correct?: number
          answers_total?: number
          created_at?: string
          id?: string
          lesson_id?: string | null
          note?: string | null
          points?: number
          scored_on?: string
          telegram_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "scores_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_telegram_id_fkey"
            columns: ["telegram_id"]
            isOneToOne: false
            referencedRelation: "tg_users"
            referencedColumns: ["telegram_id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          full_name: string
          id: string
          subject: string | null
          telegram_username: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          subject?: string | null
          telegram_username?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          subject?: string | null
          telegram_username?: string | null
        }
        Relationships: []
      }
      tg_admins: {
        Row: {
          created_at: string
          telegram_id: number
        }
        Insert: {
          created_at?: string
          telegram_id: number
        }
        Update: {
          created_at?: string
          telegram_id?: number
        }
        Relationships: []
      }
      tg_processed_updates: {
        Row: {
          created_at: string
          update_id: number
        }
        Insert: {
          created_at?: string
          update_id: number
        }
        Update: {
          created_at?: string
          update_id?: number
        }
        Relationships: []
      }
      tg_users: {
        Row: {
          avatar_url: string | null
          chat_id: number
          created_at: string
          district: string | null
          full_name: string | null
          goal: string | null
          group_id: string | null
          region: string | null
          registered_at: string | null
          role: string | null
          step: string
          telegram_id: number
          tg_first_name: string | null
          updated_at: string
          username: string | null
          weekly_goal: number
        }
        Insert: {
          avatar_url?: string | null
          chat_id: number
          created_at?: string
          district?: string | null
          full_name?: string | null
          goal?: string | null
          group_id?: string | null
          region?: string | null
          registered_at?: string | null
          role?: string | null
          step?: string
          telegram_id: number
          tg_first_name?: string | null
          updated_at?: string
          username?: string | null
          weekly_goal?: number
        }
        Update: {
          avatar_url?: string | null
          chat_id?: number
          created_at?: string
          district?: string | null
          full_name?: string | null
          goal?: string | null
          group_id?: string | null
          region?: string | null
          registered_at?: string | null
          role?: string | null
          step?: string
          telegram_id?: number
          tg_first_name?: string | null
          updated_at?: string
          username?: string | null
          weekly_goal?: number
        }
        Relationships: [
          {
            foreignKeyName: "tg_users_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
