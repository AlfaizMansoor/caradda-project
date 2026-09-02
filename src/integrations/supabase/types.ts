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
      documents: {
        Row: {
          created_at: string
          document_type: string
          id: string
          secure_file_path: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          id?: string
          secure_file_path: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          id?: string
          secure_file_path?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiries: {
        Row: {
          buyer_email: string
          buyer_id: string | null
          buyer_name: string
          buyer_phone: string
          created_at: string
          id: string
          message: string | null
          preferred_contact: string
          reference: string
          seller_id: string
          status: Database["public"]["Enums"]["enquiry_status"]
          vehicle_id: string
        }
        Insert: {
          buyer_email: string
          buyer_id?: string | null
          buyer_name: string
          buyer_phone: string
          created_at?: string
          id?: string
          message?: string | null
          preferred_contact?: string
          reference?: string
          seller_id: string
          status?: Database["public"]["Enums"]["enquiry_status"]
          vehicle_id: string
        }
        Update: {
          buyer_email?: string
          buyer_id?: string | null
          buyer_name?: string
          buyer_phone?: string
          created_at?: string
          id?: string
          message?: string | null
          preferred_contact?: string
          reference?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["enquiry_status"]
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          email_verified: boolean
          full_name: string
          id: string
          member_id: string | null
          phone: string | null
          phone_verified: boolean
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          email_verified?: boolean
          full_name?: string
          id: string
          member_id?: string | null
          phone?: string | null
          phone_verified?: boolean
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          email_verified?: boolean
          full_name?: string
          id?: string
          member_id?: string | null
          phone?: string | null
          phone_verified?: boolean
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_primary: boolean
          sort_order: number
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean
          sort_order?: number
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean
          sort_order?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_images_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          category: Database["public"]["Enums"]["vehicle_category"]
          chassis_number: string | null
          company: string
          condition: string
          created_at: string
          description: string | null
          engine_number: string | null
          fuel_type: string
          id: string
          location: string
          manufacturing_year: number
          mileage: number
          model: string
          ownership: string
          price: number
          registration_year: number | null
          rejection_reason: string | null
          seller_id: string | null
          status: Database["public"]["Enums"]["listing_status"]
          transmission: string
          updated_at: string
          variant: string | null
          vehicle_number: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          category: Database["public"]["Enums"]["vehicle_category"]
          chassis_number?: string | null
          company: string
          condition?: string
          created_at?: string
          description?: string | null
          engine_number?: string | null
          fuel_type?: string
          id?: string
          location: string
          manufacturing_year: number
          mileage?: number
          model: string
          ownership?: string
          price: number
          registration_year?: number | null
          rejection_reason?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          transmission?: string
          updated_at?: string
          variant?: string | null
          vehicle_number?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          category?: Database["public"]["Enums"]["vehicle_category"]
          chassis_number?: string | null
          company?: string
          condition?: string
          created_at?: string
          description?: string | null
          engine_number?: string | null
          fuel_type?: string
          id?: string
          location?: string
          manufacturing_year?: number
          mileage?: number
          model?: string
          ownership?: string
          price?: number
          registration_year?: number | null
          rejection_reason?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          transmission?: string
          updated_at?: string
          variant?: string | null
          vehicle_number?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
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
      app_role: "buyer" | "seller" | "admin"
      enquiry_status: "new" | "contacted" | "in_progress" | "closed"
      listing_status: "draft" | "active" | "sold" | "inactive" | "suspended"
      vehicle_category:
        | "car"
        | "bike"
        | "truck"
        | "bus"
        | "tractor"
        | "commercial"
        | "other"
      verification_status: "pending" | "verified" | "rejected"
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
    Enums: {
      app_role: ["buyer", "seller", "admin"],
      enquiry_status: ["new", "contacted", "in_progress", "closed"],
      listing_status: ["draft", "active", "sold", "inactive", "suspended"],
      vehicle_category: [
        "car",
        "bike",
        "truck",
        "bus",
        "tractor",
        "commercial",
        "other",
      ],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
