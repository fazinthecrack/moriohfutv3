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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      custom_card_pool: {
        Row: {
          created_at: string
          emoji: string
          free_odds: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          overall: number
          position: string
          premium_odds: number
          quick_sell_max: number
          quick_sell_min: number
          rarity: string
          stats_def: number
          stats_dri: number
          stats_pas: number
          stats_phy: number
          stats_rap: number
          stats_tir: number
        }
        Insert: {
          created_at?: string
          emoji?: string
          free_odds?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          overall?: number
          position?: string
          premium_odds?: number
          quick_sell_max?: number
          quick_sell_min?: number
          rarity?: string
          stats_def?: number
          stats_dri?: number
          stats_pas?: number
          stats_phy?: number
          stats_rap?: number
          stats_tir?: number
        }
        Update: {
          created_at?: string
          emoji?: string
          free_odds?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          overall?: number
          position?: string
          premium_odds?: number
          quick_sell_max?: number
          quick_sell_min?: number
          rarity?: string
          stats_def?: number
          stats_dri?: number
          stats_pas?: number
          stats_phy?: number
          stats_rap?: number
          stats_tir?: number
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          created_at: string
          credits_reward: number
          guest_id: string | null
          guest_overall: number
          guest_score: number
          guest_tactics: Json
          host_id: string
          host_overall: number
          host_score: number
          host_tactics: Json
          id: string
          round: number
          status: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          credits_reward?: number
          guest_id?: string | null
          guest_overall?: number
          guest_score?: number
          guest_tactics?: Json
          host_id: string
          host_overall?: number
          host_score?: number
          host_tactics?: Json
          id?: string
          round?: number
          status?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          credits_reward?: number
          guest_id?: string | null
          guest_overall?: number
          guest_score?: number
          guest_tactics?: Json
          host_id?: string
          host_overall?: number
          host_score?: number
          host_tactics?: Json
          id?: string
          round?: number
          status?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          buyer_id: string | null
          card_id: string
          created_at: string
          id: string
          price: number
          seller_id: string
          sold_at: string | null
          status: string
        }
        Insert: {
          buyer_id?: string | null
          card_id: string
          created_at?: string
          id?: string
          price: number
          seller_id: string
          sold_at?: string | null
          status?: string
        }
        Update: {
          buyer_id?: string | null
          card_id?: string
          created_at?: string
          id?: string
          price?: number
          seller_id?: string
          sold_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "user_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          credits_earned: number
          id: string
          opponent_id: string
          opponent_overall: number
          player_id: string
          player_overall: number
          player_won: boolean
          points_change: number
        }
        Insert: {
          created_at?: string
          credits_earned?: number
          id?: string
          opponent_id: string
          opponent_overall?: number
          player_id: string
          player_overall?: number
          player_won: boolean
          points_change?: number
        }
        Update: {
          created_at?: string
          credits_earned?: number
          id?: string
          opponent_id?: string
          opponent_overall?: number
          player_id?: string
          player_overall?: number
          player_won?: boolean
          points_change?: number
        }
        Relationships: []
      }
      pack_opens: {
        Row: {
          id: string
          opened_at: string
          user_id: string
        }
        Insert: {
          id?: string
          opened_at?: string
          user_id: string
        }
        Update: {
          id?: string
          opened_at?: string
          user_id?: string
        }
        Relationships: []
      }
      playlist_songs: {
        Row: {
          created_at: string
          id: string
          platform: string
          title: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          title: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits: number
          id: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          id?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          id?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      user_cards: {
        Row: {
          created_at: string
          emoji: string
          evolution_level: number
          id: string
          image_url: string | null
          is_listed: boolean
          is_tradeable: boolean
          name: string
          overall: number
          position: string
          rarity: string
          stat_atk: number
          stat_def: number
          stat_dri: number
          stat_int: number
          stat_pas: number
          stat_phy: number
          stat_rap: number
          stat_tir: number
          stat_vit: number
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          emoji?: string
          evolution_level?: number
          id?: string
          image_url?: string | null
          is_listed?: boolean
          is_tradeable?: boolean
          name: string
          overall?: number
          position?: string
          rarity: string
          stat_atk?: number
          stat_def?: number
          stat_dri?: number
          stat_int?: number
          stat_pas?: number
          stat_phy?: number
          stat_rap?: number
          stat_tir?: number
          stat_vit?: number
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          emoji?: string
          evolution_level?: number
          id?: string
          image_url?: string | null
          is_listed?: boolean
          is_tradeable?: boolean
          name?: string
          overall?: number
          position?: string
          rarity?: string
          stat_atk?: number
          stat_def?: number
          stat_dri?: number
          stat_int?: number
          stat_pas?: number
          stat_phy?: number
          stat_rap?: number
          stat_tir?: number
          stat_vit?: number
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      user_divisions: {
        Row: {
          created_at: string
          division: number
          id: string
          losses: number
          points: number
          updated_at: string
          user_id: string
          wins: number
        }
        Insert: {
          created_at?: string
          division?: number
          id?: string
          losses?: number
          points?: number
          updated_at?: string
          user_id: string
          wins?: number
        }
        Update: {
          created_at?: string
          division?: number
          id?: string
          losses?: number
          points?: number
          updated_at?: string
          user_id?: string
          wins?: number
        }
        Relationships: []
      }
      user_teams: {
        Row: {
          created_at: string
          id: string
          logo_url: string
          team_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string
          team_name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string
          team_name?: string
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
      admin_set_credits: {
        Args: { new_credits: number; target_user_id: string }
        Returns: Json
      }
      buy_card: { Args: { listing_id: string }; Returns: Json }
      evolve_card: { Args: { card_id: string }; Returns: Json }
      join_game: { Args: { session_id: string }; Returns: Json }
      open_premium_pack: { Args: { cost: number }; Returns: Json }
      quick_sell_card: {
        Args: { card_id: string; sell_price: number }
        Returns: Json
      }
      submit_tactic: {
        Args: { session_id: string; tactic: string }
        Returns: Json
      }
      update_listing_price: {
        Args: { listing_id: string; new_price: number }
        Returns: Json
      }
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
