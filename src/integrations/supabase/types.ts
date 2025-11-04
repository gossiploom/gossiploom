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
      forex_news: {
        Row: {
          created_at: string
          currency: string
          event_time: string
          forecast: string | null
          id: string
          impact: string
          previous: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency: string
          event_time: string
          forecast?: string | null
          id?: string
          impact: string
          previous?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          event_time?: string
          forecast?: string | null
          id?: string
          impact?: string
          previous?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          activated: boolean | null
          confidence: number
          created_at: string
          direction: string
          display_user_id: string | null
          entry: number
          id: string
          invalidation: string
          news_items: Json | null
          outcome: string | null
          profit_loss: number | null
          rationale: Json
          reward_amount: number
          risk_amount: number
          status: string | null
          stop_loss: number
          symbol: string
          take_profit: number
          timeframe: string
          trade_type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activated?: boolean | null
          confidence: number
          created_at?: string
          direction: string
          display_user_id?: string | null
          entry: number
          id?: string
          invalidation: string
          news_items?: Json | null
          outcome?: string | null
          profit_loss?: number | null
          rationale: Json
          reward_amount: number
          risk_amount: number
          status?: string | null
          stop_loss: number
          symbol: string
          take_profit: number
          timeframe: string
          trade_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activated?: boolean | null
          confidence?: number
          created_at?: string
          direction?: string
          display_user_id?: string | null
          entry?: number
          id?: string
          invalidation?: string
          news_items?: Json | null
          outcome?: string | null
          profit_loss?: number | null
          rationale?: Json
          reward_amount?: number
          risk_amount?: number
          status?: string | null
          stop_loss?: number
          symbol?: string
          take_profit?: number
          timeframe?: string
          trade_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_trades_display_user_id"
            columns: ["display_user_id"]
            isOneToOne: false
            referencedRelation: "user_settings"
            referencedColumns: ["display_user_id"]
          },
        ]
      }
      user_settings: {
        Row: {
          analysis_limit: number | null
          created_at: string
          display_user_id: string
          id: string
          trading_style: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_limit?: number | null
          created_at?: string
          display_user_id: string
          id?: string
          trading_style?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_limit?: number | null
          created_at?: string
          display_user_id?: string
          id?: string
          trading_style?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_display_user_id: { Args: never; Returns: string }
      get_current_display_user_id: { Args: never; Returns: string }
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
