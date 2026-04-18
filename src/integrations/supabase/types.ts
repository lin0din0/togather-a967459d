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
      chat_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          person_id: string
          role: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          person_id: string
          role?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          person_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cost_label: string | null
          created_at: string
          end_time: string
          event_date: string
          id: string
          location: string | null
          notes: string | null
          person_id: string | null
          start_time: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          cost_label?: string | null
          created_at?: string
          end_time?: string
          event_date: string
          id?: string
          location?: string | null
          notes?: string | null
          person_id?: string | null
          start_time?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          cost_label?: string | null
          created_at?: string
          end_time?: string
          event_date?: string
          id?: string
          location?: string | null
          notes?: string | null
          person_id?: string | null
          start_time?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          avatar_color: string
          cadence: string | null
          connection_type: string
          created_at: string
          email: string | null
          example_idea: string | null
          goal: string | null
          id: string
          initials: string
          last_met: string | null
          name: string
          relation: string
          status: string | null
          user_id: string
        }
        Insert: {
          avatar_color?: string
          cadence?: string | null
          connection_type?: string
          created_at?: string
          email?: string | null
          example_idea?: string | null
          goal?: string | null
          id?: string
          initials?: string
          last_met?: string | null
          name: string
          relation?: string
          status?: string | null
          user_id: string
        }
        Update: {
          avatar_color?: string
          cadence?: string | null
          connection_type?: string
          created_at?: string
          email?: string | null
          example_idea?: string | null
          goal?: string | null
          id?: string
          initials?: string
          last_met?: string | null
          name?: string
          relation?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_prefs: string[]
          budget_kr: number
          calendar_provider: string
          challenge: string | null
          created_at: string
          display_name: string
          free_days_per_week: number
          id: string
          interests: string[]
          location: string | null
          member_since: string | null
          notifications_on: boolean
          protected_days: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_prefs?: string[]
          budget_kr?: number
          calendar_provider?: string
          challenge?: string | null
          created_at?: string
          display_name?: string
          free_days_per_week?: number
          id?: string
          interests?: string[]
          location?: string | null
          member_since?: string | null
          notifications_on?: boolean
          protected_days?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_prefs?: string[]
          budget_kr?: number
          calendar_provider?: string
          challenge?: string | null
          created_at?: string
          display_name?: string
          free_days_per_week?: number
          id?: string
          interests?: string[]
          location?: string | null
          member_since?: string | null
          notifications_on?: boolean
          protected_days?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule_blocks: {
        Row: {
          created_at: string
          date: string
          end_hour: number
          id: string
          kind: string
          label: string
          start_hour: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          end_hour: number
          id?: string
          kind?: string
          label?: string
          start_hour: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          end_hour?: number
          id?: string
          kind?: string
          label?: string
          start_hour?: number
          user_id?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
