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
      bookings: {
        Row: {
          booking_date: string
          booking_type: string
          created_at: string
          details: Json | null
          id: string
          item_name: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date: string
          booking_type: string
          created_at?: string
          details?: Json | null
          id?: string
          item_name: string
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          booking_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          item_name?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cms_cabs: {
        Row: {
          base_fare: number
          capacity: number
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price_per_km: number
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          base_fare?: number
          capacity: number
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price_per_km: number
          updated_at?: string
          vehicle_type: string
        }
        Update: {
          base_fare?: number
          capacity?: number
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price_per_km?: number
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      cms_faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_active: boolean | null
          question: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          question: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          question?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      cms_hotels: {
        Row: {
          amenities: string[] | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          location: string
          name: string
          price_per_night: number
          rating: number | null
          review_count: number | null
          room_types: Json | null
          star_rating: number
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location: string
          name: string
          price_per_night: number
          rating?: number | null
          review_count?: number | null
          room_types?: Json | null
          star_rating: number
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string
          name?: string
          price_per_night?: number
          rating?: number | null
          review_count?: number | null
          room_types?: Json | null
          star_rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      cms_packages: {
        Row: {
          created_at: string
          description: string | null
          destination: string
          duration: string
          exclusions: string[] | null
          highlights: string[] | null
          id: string
          image_url: string | null
          inclusions: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          itinerary: Json | null
          name: string
          original_price: number
          price: number
          rating: number | null
          review_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          destination: string
          duration: string
          exclusions?: string[] | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          inclusions?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          itinerary?: Json | null
          name: string
          original_price: number
          price: number
          rating?: number | null
          review_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          destination?: string
          duration?: string
          exclusions?: string[] | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          inclusions?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          itinerary?: Json | null
          name?: string
          original_price?: number
          price?: number
          rating?: number | null
          review_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      cms_testimonials: {
        Row: {
          avatar_url: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          location: string | null
          name: string
          package_name: string | null
          rating: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          name: string
          package_name?: string | null
          rating: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          location?: string | null
          name?: string
          package_name?: string | null
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      media_library: {
        Row: {
          alt_text: string | null
          created_at: string
          file_path: string
          file_size: number | null
          filename: string
          id: string
          mime_type: string | null
          original_name: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          mime_type?: string | null
          original_name: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          mime_type?: string | null
          original_name?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          image_url: string | null
          section_key: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
          section_key: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
          section_key?: string
          subtitle?: string | null
          title?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
