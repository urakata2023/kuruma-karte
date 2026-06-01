import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'

/**
 * スーパー管理者 = SUPER_ADMIN_EMAIL に一致するメールでログイン中のユーザー。
 *
 * 単一の管理者運用前提（佐藤さん）。複数になったら配列 / shop_members への
 * role='super_admin' フィールド追加に切り替える。
 */
export function getSuperAdminEmail(): string | null {
  const v = process.env.SUPER_ADMIN_EMAIL?.trim()
  return v && v.length > 0 ? v.toLowerCase() : null
}

/**
 * 現ログインユーザーがスーパー管理者か。Server Component から呼ぶ。
 * envが未設定なら常に false（本番で誤って晒さないための保険）。
 */
export async function isSuperAdmin(): Promise<boolean> {
  const target = getSuperAdminEmail()
  if (!target) return false
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const email = user?.email?.toLowerCase() ?? null
  return email === target
}

/**
 * /admin/* のページ先頭で呼ぶ。スーパー管理者でなければ /login へリダイレクト。
 * 通常ユーザーには "管理画面の存在自体を見せない" 方針（404相当の挙動）。
 */
export async function requireSuperAdmin(): Promise<void> {
  if (!(await isSuperAdmin())) {
    redirect('/login')
  }
}
