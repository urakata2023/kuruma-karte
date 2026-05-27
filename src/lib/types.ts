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
