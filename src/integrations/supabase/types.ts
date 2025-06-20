export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      amazon_products: {
        Row: {
          amazon_revenue_id: string
          created_at: string
          fatturato_prodotto: number | null
          id: string
          nome: string
          quantita: number
        }
        Insert: {
          amazon_revenue_id: string
          created_at?: string
          fatturato_prodotto?: number | null
          id?: string
          nome: string
          quantita?: number
        }
        Update: {
          amazon_revenue_id?: string
          created_at?: string
          fatturato_prodotto?: number | null
          id?: string
          nome?: string
          quantita?: number
        }
        Relationships: [
          {
            foreignKeyName: "amazon_products_amazon_revenue_id_fkey"
            columns: ["amazon_revenue_id"]
            isOneToOne: false
            referencedRelation: "amazon_revenue"
            referencedColumns: ["id"]
          },
        ]
      }
      amazon_revenue: {
        Row: {
          created_at: string
          fatturato: number
          id: string
          month: string
          roi: number
          spesa_ads: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          fatturato: number
          id?: string
          month: string
          roi?: number
          spesa_ads?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          fatturato?: number
          id?: string
          month?: string
          roi?: number
          spesa_ads?: number
          updated_at?: string
        }
        Relationships: []
      }
      campaign_products: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          nome: string
          quantita: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          nome: string
          quantita: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          nome?: string
          quantita?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_products_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number
          created_at: string
          data: string
          descrizione: string | null
          fatturato: number
          id: string
          ordini: number
          prodotti: number
          prodotti_medi_per_ordine: number
          roi: number
          titolo: string
          updated_at: string
          valore_medio_ordine: number
        }
        Insert: {
          budget: number
          created_at?: string
          data: string
          descrizione?: string | null
          fatturato: number
          id?: string
          ordini: number
          prodotti: number
          prodotti_medi_per_ordine: number
          roi: number
          titolo: string
          updated_at?: string
          valore_medio_ordine: number
        }
        Update: {
          budget?: number
          created_at?: string
          data?: string
          descrizione?: string | null
          fatturato?: number
          id?: string
          ordini?: number
          prodotti?: number
          prodotti_medi_per_ordine?: number
          roi?: number
          titolo?: string
          updated_at?: string
          valore_medio_ordine?: number
        }
        Relationships: []
      }
      monthly_orders: {
        Row: {
          ads_spent: number
          created_at: string
          id: string
          imponibile_totale: number
          importo_totale_iva_inclusa: number
          is_amazon: boolean
          iva: number
          month: string
          pezzi_totali: number
          prodotto: string
          total_orders: number
          updated_at: string
        }
        Insert: {
          ads_spent?: number
          created_at?: string
          id?: string
          imponibile_totale?: number
          importo_totale_iva_inclusa?: number
          is_amazon?: boolean
          iva?: number
          month: string
          pezzi_totali?: number
          prodotto: string
          total_orders?: number
          updated_at?: string
        }
        Update: {
          ads_spent?: number
          created_at?: string
          id?: string
          imponibile_totale?: number
          importo_totale_iva_inclusa?: number
          is_amazon?: boolean
          iva?: number
          month?: string
          pezzi_totali?: number
          prodotto?: string
          total_orders?: number
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          prodotto: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          prodotto: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          prodotto?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_date: string
          shipping_cost: number
          total_revenue: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_date: string
          shipping_cost?: number
          total_revenue?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_date?: string
          shipping_cost?: number
          total_revenue?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string
          id: string
          month: string
          orders_count: number
          payment_method: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          orders_count?: number
          payment_method: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          orders_count?: number
          payment_method?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_costs: {
        Row: {
          created_at: string
          has_shipping_cost: boolean
          id: string
          packaging_cost: number
          prodotto: string
          production_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          has_shipping_cost?: boolean
          id?: string
          packaging_cost?: number
          prodotto: string
          production_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          has_shipping_cost?: boolean
          id?: string
          packaging_cost?: number
          prodotto?: string
          production_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      task_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completion_percentage: number
          created_at: string
          description: string | null
          due_date: string
          id: string
          parent_task_id: string | null
          priority: string
          start_date: string
          team_member: string
          title: string
          updated_at: string
        }
        Insert: {
          completion_percentage?: number
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          parent_task_id?: string | null
          priority?: string
          start_date: string
          team_member: string
          title: string
          updated_at?: string
        }
        Update: {
          completion_percentage?: number
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          parent_task_id?: string | null
          priority?: string
          start_date?: string
          team_member?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_duration_weeks: {
        Args: { start_date: string; due_date: string }
        Returns: number
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
