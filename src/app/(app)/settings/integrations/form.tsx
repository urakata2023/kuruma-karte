'use client'

import { useActionState } from 'react'
import { updateIntegrations } from './actions'

type State = { error?: string } | undefined

export function IntegrationsForm({
  initial,
}: {
  initial: {
    line_channel_access_token: string | null
    line_owner_user_id: string | null
    liny_api_key: string | null
    liny_workspace_id: string | null
  } | null
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    updateIntegrations as unknown as (
      prev: State,
      formData: FormData
    ) => Promise<State>,
    undefined
  )

  return (
    <form action={formAction} className="space-y-6">
      <fieldset className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-black">
        <legend className="text-sm font-semibold">📱 LINE 公式アカウント</legend>
        <p className="text-xs text-zinc-500">
          車検通知や予約受付を LINE で送るために必要。
        </p>

        <div className="space-y-1">
          <label className="block text-xs font-medium">
            チャネルアクセストークン
          </label>
          <input
            type="password"
            name="line_channel_access_token"
            defaultValue={initial?.line_channel_access_token ?? ''}
            placeholder="長文の英数字 (空欄で連携OFF)"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium">
            店主自身の LINE userId (Push通知先)
          </label>
          <input
            type="text"
            name="line_owner_user_id"
            defaultValue={initial?.line_owner_user_id ?? ''}
            placeholder="U で始まる33桁の userId"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
          <p className="text-[10px] text-zinc-500">
            ここに入れた userId 宛に「新規予約あり」などの通知が飛びます
          </p>
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-black">
        <legend className="text-sm font-semibold">🤖 Liny (Lステップ系)</legend>
        <p className="text-xs text-zinc-500">
          既存の Liny シナリオを使う場合に入力。くるまカルテがイベント時にタグを付けて、Liny の配信を発火します。
        </p>

        <div className="space-y-1">
          <label className="block text-xs font-medium">Liny API キー</label>
          <input
            type="password"
            name="liny_api_key"
            defaultValue={initial?.liny_api_key ?? ''}
            placeholder="空欄で連携OFF"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium">
            ワークスペースID
          </label>
          <input
            type="text"
            name="liny_workspace_id"
            defaultValue={initial?.liny_workspace_id ?? ''}
            placeholder=""
            className="w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
      </fieldset>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {pending ? '保存中…' : '保存する'}
      </button>
    </form>
  )
}
