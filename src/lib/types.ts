// DB型定義（手書き）
// 将来 supabase CLI で `supabase gen types typescript` に置換予定

export type Shop = {
  id: string
  owner_user_id: string
  name: string
  address: string | null
  phone: string | null
  plan: 'trial' | 'standard' | 'pro'
  stripe_customer_id: string | null
  line_channel_token: string | null
  registration_token: string
  theme: string // ThemeId (Phase 10) — マイページ/管理画面のカラーリング
  // Phase C: LINE/Liny 連携
  line_channel_access_token: string | null
  line_owner_user_id: string | null
  liny_api_key: string | null
  liny_workspace_id: string | null
  // Phase D: Stripe サブスク
  stripe_subscription_id: string | null
  subscription_status: string | null
  current_period_end: string | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

export type Customer = {
  id: string
  shop_id: string
  name: string
  phone: string | null
  email: string | null
  line_user_id: string | null
  memo: string | null
  created_at: string
  updated_at: string
}

export type Vehicle = {
  id: string
  customer_id: string
  shop_id: string
  model: string | null
  plate_number: string | null
  first_registration_ym: string | null
  inspection_expires_on: string | null
  purchased_on: string | null
  last_oil_change_on: string | null
  photo_url: string | null
  view_token: string
  created_at: string
  updated_at: string
}

export type Notification = {
  id: string
  vehicle_id: string
  kind: 'inspection' | 'oil_change' | 'general'
  scheduled_on: string
  sent_at: string | null
  channel: 'mail' | 'line' | null
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  message: string | null
  created_at: string
}

export type VehiclePhoto = {
  id: string
  vehicle_id: string
  shop_id: string
  photo_url: string
  caption: string | null
  sort_order: number
  created_at: string
}

export type TouringRecord = {
  id: string
  vehicle_id: string
  shop_id: string
  touring_date: string
  title: string
  place_name: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  photo_url: string | null
  memo: string | null
  created_by: 'shop' | 'customer'
  created_at: string
  updated_at: string
}

export type Reservation = {
  id: string
  shop_id: string
  customer_id: string
  vehicle_id: string
  desired_date: string
  desired_slot: 'morning' | 'afternoon' | 'evening' | 'any' | null
  purpose: string
  customer_note: string | null
  confirmed_date: string | null
  confirmed_slot: 'morning' | 'afternoon' | 'evening' | null
  shop_note: string | null
  status: 'requested' | 'confirmed' | 'rejected' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export type MaintenanceRecord = {
  id: string
  vehicle_id: string
  shop_id: string
  performed_on: string
  mileage_km: number | null
  title: string
  description: string | null
  parts: string | null
  cost: number | null
  created_by: 'shop' | 'customer'
  attachment_url: string | null
  before_photo_url: string | null // Phase A
  after_photo_url: string | null // Phase A
  created_at: string
  updated_at: string
}
