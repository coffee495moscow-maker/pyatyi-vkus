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

export interface User {
  id: string;
  email: string;
  password_hash: string;
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
}

export type PublicUser = Omit<User, "password_hash">;

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
}

export interface Product {
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
}

export interface Order {
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
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name_snapshot: string;
  unit_price_kopecks_snapshot: number;
  quantity: number;
  subtotal_kopecks: number;
}

export interface OrderStatusHistoryEntry {
  id: string;
  order_id: string;
  status: string;
  changed_by: string | null;
  created_at: string;
}

export interface Favorite {
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface LoyaltyLedgerEntry {
  id: string;
  user_id: string;
  order_id: string | null;
  delta_points: number;
  reason: LoyaltyReason;
  created_at: string;
}

export interface Badge {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
}

export interface UserBadge {
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  image_path: string | null;
  discount_type: string | null;
  discount_value: number | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface B2bInquiry {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  email: string | null;
  message: string | null;
  status: string;
  created_at: string;
}
