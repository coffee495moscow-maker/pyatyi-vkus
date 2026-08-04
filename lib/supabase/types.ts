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

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: UserRole;
          points_balance: number;
          lifetime_points: number;
          tier: UserTier;
          current_streak_weeks: number;
          last_order_week: string | null;
          last_order_at: string | null;
          created_at: string;
        },
        {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          points_balance?: number;
          lifetime_points?: number;
          tier?: UserTier;
          current_streak_weeks?: number;
          last_order_week?: string | null;
          last_order_at?: string | null;
          created_at?: string;
        }
      >;
      categories: Table<
        { id: string; slug: string; name: string; sort_order: number },
        { id?: string; slug: string; name: string; sort_order?: number }
      >;
      products: Table<
        {
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
        },
        {
          id?: string;
          slug: string;
          name: string;
          description?: string;
          price_kopecks: number;
          category_id: string;
          image_path?: string | null;
          is_available?: boolean;
          is_new?: boolean;
          is_hit?: boolean;
          is_featured?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        }
      >;
      orders: Table<
        {
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
        },
        {
          id?: string;
          user_id: string;
          status?: OrderStatus;
          fulfillment_type?: string;
          pickup_note?: string | null;
          contact_phone?: string | null;
          comment?: string | null;
          subtotal_kopecks: number;
          points_redeemed?: number;
          discount_kopecks?: number;
          total_kopecks: number;
          payment_provider?: string | null;
          payment_id?: string | null;
          payment_status?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      order_items: Table<
        {
          id: string;
          order_id: string;
          product_id: string;
          product_name_snapshot: string;
          unit_price_kopecks_snapshot: number;
          quantity: number;
          subtotal_kopecks: number;
        },
        {
          id?: string;
          order_id: string;
          product_id: string;
          product_name_snapshot: string;
          unit_price_kopecks_snapshot: number;
          quantity: number;
          subtotal_kopecks: number;
        }
      >;
      order_status_history: Table<
        {
          id: string;
          order_id: string;
          status: string;
          changed_by: string | null;
          created_at: string;
        },
        {
          id?: string;
          order_id: string;
          status: string;
          changed_by?: string | null;
          created_at?: string;
        }
      >;
      favorites: Table<
        { user_id: string; product_id: string; created_at: string },
        { user_id: string; product_id: string; created_at?: string }
      >;
      loyalty_ledger: Table<
        {
          id: string;
          user_id: string;
          order_id: string | null;
          delta_points: number;
          reason: LoyaltyReason;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          order_id?: string | null;
          delta_points: number;
          reason: LoyaltyReason;
          created_at?: string;
        }
      >;
      badges: Table<
        { id: string; code: string; title: string; description: string; icon: string },
        { id?: string; code: string; title: string; description: string; icon?: string }
      >;
      user_badges: Table<
        { user_id: string; badge_id: string; earned_at: string },
        { user_id: string; badge_id: string; earned_at?: string }
      >;
      promotions: Table<
        {
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
        },
        {
          id?: string;
          title: string;
          description?: string;
          image_path?: string | null;
          discount_type?: string | null;
          discount_value?: number | null;
          starts_at?: string | null;
          ends_at?: string | null;
          is_active?: boolean;
          notified_at?: string | null;
          created_at?: string;
        }
      >;
      push_subscriptions: Table<
        {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          created_at?: string;
        }
      >;
      b2b_inquiries: Table<
        {
          id: string;
          company_name: string;
          contact_name: string;
          phone: string;
          email: string | null;
          message: string | null;
          status: string;
          created_at: string;
        },
        {
          id?: string;
          company_name: string;
          contact_name: string;
          phone: string;
          email?: string | null;
          message?: string | null;
          status?: string;
          created_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      create_order: {
        Args: {
          p_items: { product_id: string; quantity: number }[];
          p_fulfillment_type?: string;
          p_pickup_note?: string | null;
          p_contact_phone?: string | null;
          p_comment?: string | null;
          p_points_to_redeem?: number;
        };
        Returns: string;
      };
      attach_payment: {
        Args: { p_order_id: string; p_provider: string; p_payment_id: string };
        Returns: undefined;
      };
      check_and_award_badges: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
