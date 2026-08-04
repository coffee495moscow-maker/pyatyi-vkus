export type OrderStatus =
  | "created"
  | "awaiting_payment"
  | "paid"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type UserRole = "customer" | "admin";
export type UserTier = "bronze" | "silver" | "gold";

export type LoyaltyReason =
  | "earn_purchase"
  | "redeem"
  | "bonus_signup"
  | "streak_bonus"
  | "badge_bonus"
  | "admin_adjustment"
  | "reversal";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: UserRole;
          points_balance: number;
          tier: UserTier;
          current_streak_weeks: number;
          last_order_week: string | null;
          last_order_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          price_kopecks: number;
          category_id: string;
          image_path: string | null;
          is_available: boolean;
          is_new: boolean;
          is_hit: boolean;
          is_featured: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          status: OrderStatus;
          fulfillment_type: string;
          pickup_note: string | null;
          contact_phone: string | null;
          comment: string | null;
          subtotal_kopecks: number;
          points_redeemed: number;
          discount_kopecks: number;
          total_kopecks: number;
          payment_provider: string | null;
          payment_id: string | null;
          payment_status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_name_snapshot: string;
          unit_price_kopecks_snapshot: number;
          quantity: number;
          subtotal_kopecks: number;
        };
        Insert: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
      };
      favorites: {
        Row: {
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["favorites"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["favorites"]["Row"]>;
      };
      loyalty_ledger: {
        Row: {
          id: string;
          user_id: string;
          order_id: string | null;
          delta_points: number;
          reason: LoyaltyReason;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["loyalty_ledger"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["loyalty_ledger"]["Row"]>;
      };
      badges: {
        Row: {
          id: string;
          code: string;
          title: string;
          description: string;
          icon: string;
        };
        Insert: Partial<Database["public"]["Tables"]["badges"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["badges"]["Row"]>;
      };
      user_badges: {
        Row: {
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_badges"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["user_badges"]["Row"]>;
      };
      promotions: {
        Row: {
          id: string;
          title: string;
          description: string;
          image_path: string | null;
          discount_type: string | null;
          discount_value: number | null;
          starts_at: string | null;
          ends_at: string | null;
          is_active: boolean;
          notified_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["promotions"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["promotions"]["Row"]>;
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["push_subscriptions"]["Row"]
        >;
        Update: Partial<
          Database["public"]["Tables"]["push_subscriptions"]["Row"]
        >;
      };
      b2b_inquiries: {
        Row: {
          id: string;
          company_name: string;
          contact_name: string;
          phone: string;
          email: string | null;
          message: string | null;
          status: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["b2b_inquiries"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["b2b_inquiries"]["Row"]>;
      };
    };
  };
}
