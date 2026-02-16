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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      catalog_items: {
        Row: {
          active: boolean | null
          attributes_json: Json | null
          branch_id: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          item_type: string
          merchant_id: string
          name: string
          name_ar: string | null
          photos: Json | null
          price_fixed: number | null
          price_max: number | null
          price_min: number | null
          price_type: string | null
        }
        Insert: {
          active?: boolean | null
          attributes_json?: Json | null
          branch_id?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          item_type?: string
          merchant_id: string
          name: string
          name_ar?: string | null
          photos?: Json | null
          price_fixed?: number | null
          price_max?: number | null
          price_min?: number | null
          price_type?: string | null
        }
        Update: {
          active?: boolean | null
          attributes_json?: Json | null
          branch_id?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          item_type?: string
          merchant_id?: string
          name?: string
          name_ar?: string | null
          photos?: Json | null
          price_fixed?: number | null
          price_max?: number | null
          price_min?: number | null
          price_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_items_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "merchant_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_items_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          message: string | null
          order_id: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          message?: string | null
          order_id: string
          sender_id: string
          sender_role?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          message?: string | null
          order_id?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          id: string
          notes: string | null
          order_id: string
          stage_id: string | null
          status: string
          transaction_type: string
        }
        Insert: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          order_id: string
          stage_id?: string | null
          status?: string
          transaction_type?: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          order_id?: string
          stage_id?: string | null
          status?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "order_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_ratings: {
        Row: {
          comment: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          order_id: string
          rater_id: string
          scores_json: Json
        }
        Insert: {
          comment?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          order_id: string
          rater_id: string
          scores_json?: Json
        }
        Update: {
          comment?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          order_id?: string
          rater_id?: string
          scores_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "internal_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_branches: {
        Row: {
          address_text: string | null
          address_text_ar: string | null
          branch_name: string | null
          created_at: string
          hours_json: Json | null
          id: string
          lat: number | null
          lng: number | null
          merchant_id: string
          open_now: boolean | null
          phone: string | null
        }
        Insert: {
          address_text?: string | null
          address_text_ar?: string | null
          branch_name?: string | null
          created_at?: string
          hours_json?: Json | null
          id?: string
          lat?: number | null
          lng?: number | null
          merchant_id: string
          open_now?: boolean | null
          phone?: string | null
        }
        Update: {
          address_text?: string | null
          address_text_ar?: string | null
          branch_name?: string | null
          created_at?: string
          hours_json?: Json | null
          id?: string
          lat?: number | null
          lng?: number | null
          merchant_id?: string
          open_now?: boolean | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_branches_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          business_name: string
          business_name_ar: string | null
          category_id: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          domain_id: string | null
          id: string
          logo_url: string | null
          owner_user_id: string | null
          tags: Json | null
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          business_name: string
          business_name_ar?: string | null
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          domain_id?: string | null
          id?: string
          logo_url?: string | null
          owner_user_id?: string | null
          tags?: Json | null
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          business_name?: string
          business_name_ar?: string | null
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          domain_id?: string | null
          id?: string
          logo_url?: string | null
          owner_user_id?: string | null
          tags?: Json | null
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          catalog_item_id: string | null
          created_at: string
          free_text_description: string | null
          id: string
          item_mode: string | null
          order_id: string
          photo_urls: Json | null
          quantity: number | null
          unit: string | null
        }
        Insert: {
          catalog_item_id?: string | null
          created_at?: string
          free_text_description?: string | null
          id?: string
          item_mode?: string | null
          order_id: string
          photo_urls?: Json | null
          quantity?: number | null
          unit?: string | null
        }
        Update: {
          catalog_item_id?: string | null
          created_at?: string
          free_text_description?: string | null
          id?: string
          item_mode?: string | null
          order_id?: string
          photo_urls?: Json | null
          quantity?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_stages: {
        Row: {
          address_text: string | null
          assigned_executor_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          order_id: string
          policy_json: Json | null
          sequence_no: number
          stage_type: Database["public"]["Enums"]["stage_type"]
          started_at: string | null
          status: Database["public"]["Enums"]["stage_status"]
        }
        Insert: {
          address_text?: string | null
          assigned_executor_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          order_id: string
          policy_json?: Json | null
          sequence_no?: number
          stage_type: Database["public"]["Enums"]["stage_type"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["stage_status"]
        }
        Update: {
          address_text?: string | null
          assigned_executor_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          order_id?: string
          policy_json?: Json | null
          sequence_no?: number
          stage_type?: Database["public"]["Enums"]["stage_type"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["stage_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_stages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          category_id: string | null
          created_at: string
          currency: string | null
          customer_id: string
          domain_id: string | null
          dropoff_address: string | null
          dropoff_lat: number | null
          dropoff_lng: number | null
          escrow_status: string | null
          id: string
          notes: string | null
          order_type: Database["public"]["Enums"]["order_type"]
          pickup_address: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          purchase_price_cap: number | null
          recipient_name: string | null
          recipient_phone: string | null
          scheduled_at: string | null
          source_branch_id: string | null
          source_merchant_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          substitution_policy:
            | Database["public"]["Enums"]["substitution_policy"]
            | null
          totals_json: Json | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          currency?: string | null
          customer_id: string
          domain_id?: string | null
          dropoff_address?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          escrow_status?: string | null
          id?: string
          notes?: string | null
          order_type?: Database["public"]["Enums"]["order_type"]
          pickup_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          purchase_price_cap?: number | null
          recipient_name?: string | null
          recipient_phone?: string | null
          scheduled_at?: string | null
          source_branch_id?: string | null
          source_merchant_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          substitution_policy?:
            | Database["public"]["Enums"]["substitution_policy"]
            | null
          totals_json?: Json | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          currency?: string | null
          customer_id?: string
          domain_id?: string | null
          dropoff_address?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          escrow_status?: string | null
          id?: string
          notes?: string | null
          order_type?: Database["public"]["Enums"]["order_type"]
          pickup_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          purchase_price_cap?: number | null
          recipient_name?: string | null
          recipient_phone?: string | null
          scheduled_at?: string | null
          source_branch_id?: string | null
          source_merchant_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          substitution_policy?:
            | Database["public"]["Enums"]["substitution_policy"]
            | null
          totals_json?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_source_branch_id_fkey"
            columns: ["source_branch_id"]
            isOneToOne: false
            referencedRelation: "merchant_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_source_merchant_id_fkey"
            columns: ["source_merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          language: string | null
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          language?: string | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          language?: string | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          keys: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          keys: Json
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          keys?: Json
          user_id?: string
        }
        Relationships: []
      }
      quality_scores: {
        Row: {
          components_json: Json | null
          composite_score: number | null
          entity_id: string
          entity_type: string
          external_fetched_at: string | null
          external_rating: number | null
          external_review_count: number | null
          external_source: string | null
          id: string
          internal_avg: number | null
          internal_count: number | null
          updated_at: string
        }
        Insert: {
          components_json?: Json | null
          composite_score?: number | null
          entity_id: string
          entity_type: string
          external_fetched_at?: string | null
          external_rating?: number | null
          external_review_count?: number | null
          external_source?: string | null
          id?: string
          internal_avg?: number | null
          internal_count?: number | null
          updated_at?: string
        }
        Update: {
          components_json?: Json | null
          composite_score?: number | null
          entity_id?: string
          entity_type?: string
          external_fetched_at?: string | null
          external_rating?: number | null
          external_review_count?: number | null
          external_source?: string | null
          id?: string
          internal_avg?: number | null
          internal_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      taxonomy: {
        Row: {
          active: boolean | null
          code: string
          icon: string | null
          id: string
          name_ar: string
          name_en: string
          parent_code: string | null
          sort_order: number | null
          type: string
        }
        Insert: {
          active?: boolean | null
          code: string
          icon?: string | null
          id?: string
          name_ar: string
          name_en: string
          parent_code?: string | null
          sort_order?: number | null
          type: string
        }
        Update: {
          active?: boolean | null
          code?: string
          icon?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          parent_code?: string | null
          sort_order?: number | null
          type?: string
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          address_text: string | null
          address_text_ar: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean
          label: string
          lat: number | null
          lng: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_text?: string | null
          address_text_ar?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          label: string
          lat?: number | null
          lng?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_text?: string | null
          address_text_ar?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean
          label?: string
          lat?: number | null
          lng?: number | null
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
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "customer" | "executor" | "merchant_admin"
      dispute_status: "open" | "in_review" | "resolved" | "rejected"
      dispute_type:
        | "LATE"
        | "WRONG_ITEM"
        | "DAMAGED"
        | "NO_SHOW"
        | "FRAUD"
        | "OTHER"
      order_status:
        | "draft"
        | "payment_pending"
        | "paid"
        | "in_progress"
        | "completed"
        | "canceled"
      order_type: "DIRECT" | "PURCHASE_DELIVER" | "CHAIN"
      stage_status:
        | "pending"
        | "accepted"
        | "in_progress"
        | "completed"
        | "failed"
      stage_type: "pickup" | "purchase" | "dropoff" | "handover" | "onsite"
      substitution_policy:
        | "NONE"
        | "SAME_CATEGORY"
        | "WITHIN_PRICE"
        | "CUSTOM_RULES"
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
      app_role: ["admin", "customer", "executor", "merchant_admin"],
      dispute_status: ["open", "in_review", "resolved", "rejected"],
      dispute_type: [
        "LATE",
        "WRONG_ITEM",
        "DAMAGED",
        "NO_SHOW",
        "FRAUD",
        "OTHER",
      ],
      order_status: [
        "draft",
        "payment_pending",
        "paid",
        "in_progress",
        "completed",
        "canceled",
      ],
      order_type: ["DIRECT", "PURCHASE_DELIVER", "CHAIN"],
      stage_status: [
        "pending",
        "accepted",
        "in_progress",
        "completed",
        "failed",
      ],
      stage_type: ["pickup", "purchase", "dropoff", "handover", "onsite"],
      substitution_policy: [
        "NONE",
        "SAME_CATEGORY",
        "WITHIN_PRICE",
        "CUSTOM_RULES",
      ],
    },
  },
} as const
