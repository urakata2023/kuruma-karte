'use client'

import { useTransition } from 'react'
import { openCustomerPortal } from './actions'

export function PortalButton() {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          try {
            await openCustomerPortal()
          } catch (e) {
            alert(e instanceof Error ? e.message : 'エラー')
          }
        })
      }
      disabled={pending}
      className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
    >
      {pending ? '...' : '💳 支払い情報・解約 (Stripe ポータル)'}
    </button>
  )
}
