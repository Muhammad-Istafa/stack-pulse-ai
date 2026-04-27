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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          agent: string
          created_at: string
          detail: string | null
          device_id: string
          id: string
          title: string
        }
        Insert: {
          action: string
          agent: string
          created_at?: string
          detail?: string | null
          device_id: string
          id?: string
          title: string
        }
        Update: {
          action?: string
          agent?: string
          created_at?: string
          detail?: string | null
          device_id?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string
          detail: string | null
          device_id: string
          id: string
          scheduled_for: string
          source: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          device_id: string
          id?: string
          scheduled_for: string
          source?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          device_id?: string
          id?: string
          scheduled_for?: string
          source?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      emails: {
        Row: {
          body: string
          category: string
          created_at: string
          detected_intent: string | null
          detected_sources: string[] | null
          detected_urgency: string | null
          device_id: string
          id: string
          importance: string
          received_at: string
          sender_email: string
          sender_name: string
          status: string
          subject: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          detected_intent?: string | null
          detected_sources?: string[] | null
          detected_urgency?: string | null
          device_id: string
          id?: string
          importance?: string
          received_at?: string
          sender_email: string
          sender_name: string
          status?: string
          subject: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          detected_intent?: string | null
          detected_sources?: string[] | null
          detected_urgency?: string | null
          device_id?: string
          id?: string
          importance?: string
          received_at?: string
          sender_email?: string
          sender_name?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      ops_tasks: {
        Row: {
          context: Json | null
          created_at: string
          device_id: string
          id: string
          output: string | null
          prompt: string
          status: Database["public"]["Enums"]["task_status"]
          updated_at: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          device_id: string
          id?: string
          output?: string | null
          prompt: string
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          device_id?: string
          id?: string
          output?: string | null
          prompt?: string
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Relationships: []
      }
      tech_analyses: {
        Row: {
          ab_test: Json | null
          code_impact: Json | null
          created_at: string
          decision: string | null
          device_id: string
          feed_id: string | null
          id: string
          migration_plan: string | null
          prompt: string | null
          sandbox: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          ab_test?: Json | null
          code_impact?: Json | null
          created_at?: string
          decision?: string | null
          device_id: string
          feed_id?: string | null
          id?: string
          migration_plan?: string | null
          prompt?: string | null
          sandbox?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          ab_test?: Json | null
          code_impact?: Json | null
          created_at?: string
          decision?: string | null
          device_id?: string
          feed_id?: string | null
          id?: string
          migration_plan?: string | null
          prompt?: string | null
          sandbox?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_analyses_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "tech_feed"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_feed: {
        Row: {
          adoption: string | null
          created_at: string
          detected_at: string
          device_id: string
          github_stars: number | null
          id: string
          potential_savings_pct: number | null
          relevance_score: number | null
          source: string
          stability: string | null
          status: string
          summary: string
          title: string
          vendor: string | null
        }
        Insert: {
          adoption?: string | null
          created_at?: string
          detected_at?: string
          device_id: string
          github_stars?: number | null
          id?: string
          potential_savings_pct?: number | null
          relevance_score?: number | null
          source: string
          stability?: string | null
          status?: string
          summary: string
          title: string
          vendor?: string | null
        }
        Update: {
          adoption?: string | null
          created_at?: string
          detected_at?: string
          device_id?: string
          github_stars?: number | null
          id?: string
          potential_savings_pct?: number | null
          relevance_score?: number | null
          source?: string
          stability?: string | null
          status?: string
          summary?: string
          title?: string
          vendor?: string | null
        }
        Relationships: []
      }
      tech_tasks: {
        Row: {
          created_at: string
          device_id: string
          id: string
          migration_plan: string | null
          prompt: string
          recommendation: string | null
          sandbox_test: string | null
          status: Database["public"]["Enums"]["task_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          migration_plan?: string | null
          prompt: string
          recommendation?: string | null
          sandbox_test?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          migration_plan?: string | null
          prompt?: string
          recommendation?: string | null
          sandbox_test?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Relationships: []
      }
      workflows: {
        Row: {
          created_at: string
          device_id: string
          email_id: string | null
          error_message: string | null
          final_output: string | null
          id: string
          problem: string
          status: string
          steps: Json
          trigger: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_id: string
          email_id?: string | null
          error_message?: string | null
          final_output?: string | null
          id?: string
          problem: string
          status?: string
          steps?: Json
          trigger: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_id?: string
          email_id?: string | null
          error_message?: string | null
          final_output?: string | null
          id?: string
          problem?: string
          status?: string
          steps?: Json
          trigger?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
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
      task_status: "draft" | "approved" | "ignored"
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
      task_status: ["draft", "approved", "ignored"],
    },
  },
} as const
