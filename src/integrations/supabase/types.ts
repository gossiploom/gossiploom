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
      account_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone_number: string
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          request_ip: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone_number: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          request_ip?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone_number?: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          request_ip?: string | null
          status?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          created_by: string | null
          duration_seconds: number
          expires_at: string | null
          id: string
          is_global: boolean
          message: string
          target_user_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration_seconds?: number
          expires_at?: string | null
          id?: string
          is_global?: boolean
          message: string
          target_user_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration_seconds?: number
          expires_at?: string | null
          id?: string
          is_global?: boolean
          message?: string
          target_user_id?: string | null
          title?: string
        }
        Relationships: []
      }
      admin_signals: {
        Row: {
          additional_notes: string | null
          created_at: string
          created_by: string | null
          description: string | null
          direction: string | null
          entry_price: number | null
          expires_at: string | null
          id: string
          image_path: string | null
          outcome: string | null
          outcome_notes: string | null
          outcome_updated_at: string | null
          risk_reward: string | null
          stop_loss: number | null
          symbol: string | null
          take_profit: number | null
          title: string | null
        }
        Insert: {
          additional_notes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          direction?: string | null
          entry_price?: number | null
          expires_at?: string | null
          id?: string
          image_path?: string | null
          outcome?: string | null
          outcome_notes?: string | null
          outcome_updated_at?: string | null
          risk_reward?: string | null
          stop_loss?: number | null
          symbol?: string | null
          take_profit?: number | null
          title?: string | null
        }
        Update: {
          additional_notes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          direction?: string | null
          entry_price?: number | null
          expires_at?: string | null
          id?: string
          image_path?: string | null
          outcome?: string | null
          outcome_notes?: string | null
          outcome_updated_at?: string | null
          risk_reward?: string | null
          stop_loss?: number | null
          symbol?: string | null
          take_profit?: number | null
          title?: string | null
        }
        Relationships: []
      }
      contact_queries: {
        Row: {
          admin_response: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          responded_at: string | null
          responded_by: string | null
          status: string
          subject: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      forex_news: {
        Row: {
          actual: string | null
          created_at: string
          currency: string
          event_time: string
          forecast: string | null
          id: string
          impact: string
          previous: string | null
          source: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual?: string | null
          created_at?: string
          currency: string
          event_time: string
          forecast?: string | null
          id?: string
          impact: string
          previous?: string | null
          source?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual?: string | null
          created_at?: string
          currency?: string
          event_time?: string
          forecast?: string | null
          id?: string
          impact?: string
          previous?: string | null
          source?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_expectations: {
        Row: {
          currency_pairs: Json
          expectation_summary: string
          generated_at: string
          id: string
          news_id: string
        }
        Insert: {
          currency_pairs: Json
          expectation_summary: string
          generated_at?: string
          id?: string
          news_id: string
        }
        Update: {
          currency_pairs?: Json
          expectation_summary?: string
          generated_at?: string
          id?: string
          news_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_expectations_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "forex_news"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "admin_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_payments: {
        Row: {
          amount_kes: number
          analysis_slots: number
          checkout_request_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          package_type: string
          payment_method: string
          status: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          amount_kes: number
          analysis_slots: number
          checkout_request_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          package_type: string
          payment_method?: string
          status?: string
          transaction_id: string
          user_id: string
        }
        Update: {
          amount_kes?: number
          analysis_slots?: number
          checkout_request_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          package_type?: string
          payment_method?: string
          status?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          broker_name: string | null
          created_at: string
          id: string
          is_signal_subscriber: boolean
          last_login_ip: string | null
          name: string
          phone_number: string
          profile_completed: boolean
          referral_code: string | null
          referred_by: string | null
          registration_ip: string | null
          subscription_expires_at: string | null
          unique_identifier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_name?: string | null
          created_at?: string
          id?: string
          is_signal_subscriber?: boolean
          last_login_ip?: string | null
          name?: string
          phone_number?: string
          profile_completed?: boolean
          referral_code?: string | null
          referred_by?: string | null
          registration_ip?: string | null
          subscription_expires_at?: string | null
          unique_identifier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_name?: string | null
          created_at?: string
          id?: string
          is_signal_subscriber?: boolean
          last_login_ip?: string | null
          name?: string
          phone_number?: string
          profile_completed?: boolean
          referral_code?: string | null
          referred_by?: string | null
          registration_ip?: string | null
          subscription_expires_at?: string | null
          unique_identifier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          first_purchase_at: string | null
          has_purchased: boolean
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          first_purchase_at?: string | null
          has_purchased?: boolean
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          first_purchase_at?: string | null
          has_purchased?: boolean
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      support_messages: {
        Row: {
          attachment_path: string | null
          attachment_type: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          sender_id: string
          subject: string
          thread_id: string
        }
        Insert: {
          attachment_path?: string | null
          attachment_type?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          sender_id: string
          subject: string
          thread_id: string
        }
        Update: {
          attachment_path?: string | null
          attachment_type?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_id?: string
          subject?: string
          thread_id?: string
        }
        Relationships: []
      }
      support_threads: {
        Row: {
          created_at: string
          id: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          activated: boolean | null
          confidence: number
          created_at: string
          direction: string
          entry: number
          id: string
          invalidation: string
          news_items: Json | null
          outcome: string | null
          profit_loss: number | null
          rationale: Json
          reward_amount: number
          risk_amount: number
          status: string
          stop_loss: number
          symbol: string
          take_profit: number
          timeframe: string
          trade_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated?: boolean | null
          confidence: number
          created_at?: string
          direction: string
          entry: number
          id?: string
          invalidation: string
          news_items?: Json | null
          outcome?: string | null
          profit_loss?: number | null
          rationale: Json
          reward_amount: number
          risk_amount: number
          status?: string
          stop_loss: number
          symbol: string
          take_profit: number
          timeframe: string
          trade_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated?: boolean | null
          confidence?: number
          created_at?: string
          direction?: string
          entry?: number
          id?: string
          invalidation?: string
          news_items?: Json | null
          outcome?: string | null
          profit_loss?: number | null
          rationale?: Json
          reward_amount?: number
          risk_amount?: number
          status?: string
          stop_loss?: number
          symbol?: string
          take_profit?: number
          timeframe?: string
          trade_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usdt_payments: {
        Row: {
          amount_usd: number
          analysis_slots: number
          created_at: string
          id: string
          package_type: string
          screenshot_path: string
          status: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount_usd: number
          analysis_slots: number
          created_at?: string
          id?: string
          package_type: string
          screenshot_path: string
          status?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount_usd?: number
          analysis_slots?: number
          created_at?: string
          id?: string
          package_type?: string
          screenshot_path?: string
          status?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          created_at: string
          id: string
          is_online: boolean
          last_seen: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_seen?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_seen?: string
          user_id?: string
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_settings: {
        Row: {
          analysis_limit: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_limit?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_limit?: number
          created_at?: string
          id?: string
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
      get_next_unique_identifier: { Args: never; Returns: string }
      get_successful_referrals_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_successful_trades_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_total_referrals_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_user_slots_info: {
        Args: { target_user_id: string }
        Returns: {
          slots_remaining: number
          slots_used: number
          total_slots: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      set_admin_by_email: { Args: { admin_email: string }; Returns: undefined }
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
