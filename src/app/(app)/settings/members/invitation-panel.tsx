'use client'

import { useActionState, useState } from 'react'
import { createInvitation, revokeInvitation } from './actions'

type State = { ok?: true; code?: string; error?: string } | undefined

type Invitation = {
  id: string
  invitation_code: string
  role: 'owner' | 'staff'
  expires_at: string
  used_at: string | null
  created_at: string
}

export function InvitationPanel({
  invitations,
  appUrl,
}: {
  invitations: Invitation[]
  appUrl: string
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    createInvitation as unknown as (
      prev: State,
      formData: FormData
    ) => Promise<State>,
    undefined
  )

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold">📨 招待を発行</h2>
      <form
        action={formAction}
        className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black"
      >
        <select
          name="role"
          defaultValue="staff"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="staff">👤 スタッフとして招待</option>
          <option value="owner">👑 オーナーとして招待</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? '生成中…' : '招待コード発行'}
        </button>
      </form>

      {state?.error && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      {state?.ok && state.code && (
        <NewInviteCallout code={state.code} appUrl={appUrl} />
      )}

      {invitations.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            未使用の招待（{invitations.length}件）
          </h3>
          <ul className="space-y-2">
            {invitations.map((inv) => (
              <InvitationRow
                key={inv.id}
                invitation={inv}
                appUrl={appUrl}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function NewInviteCallout({
  code,
  appUrl,
}: {
  code: string
  appUrl: string
}) {
  const url = `${appUrl}/signup?invite=${code}`
  const [copied, setCopied] = useState(false)

  return (
    <div className="mt-3 space-y-2 rounded-md border border-green-300 bg-green-50 p-3 dark:border-green-700 dark:bg-green-950">
      <p className="text-xs font-semibold text-green-900 dark:text-green-200">
        ✓ 招待URLを発行しました（7日間有効）
      </p>
      <code className="block break-all rounded bg-white px-3 py-2 font-mono text-xs dark:bg-zinc-950">
        {url}
      </code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(url)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
        className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
      >
        {copied ? '✓ コピーしました' : '📋 URL をコピー'}
      </button>
    </div>
  )
}

function InvitationRow({
  invitation: inv,
  appUrl,
}: {
  invitation: Invitation
  appUrl: string
}) {
  const url = `${appUrl}/signup?invite=${inv.invitation_code}`
  const expires = new Date(inv.expires_at).toLocaleDateString('ja-JP')

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex-1">
        <p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              inv.role === 'owner'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
            }`}
          >
            {inv.role === 'owner' ? '👑 オーナー' : '👤 スタッフ'}
          </span>
          <span className="ml-2 text-zinc-500">期限: {expires}</span>
        </p>
        <code className="mt-1 block break-all text-[10px] text-zinc-500">
          {url}
        </code>
      </div>
      <form action={revokeInvitation.bind(null, inv.id)}>
        <button
          type="submit"
          className="text-xs font-medium text-red-600 hover:underline"
        >
          無効化
        </button>
      </form>
    </li>
  )
}
