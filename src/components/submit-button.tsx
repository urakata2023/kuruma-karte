'use client'

import { useFormStatus } from 'react-dom'

/**
 * Server Action フォーム用のサブミットボタン (汎用)
 *
 * useFormStatus で「送信中…」状態を自動取得し、
 * pending 中は disable + ラベル切替 + スピナー表示。
 *
 * 使い方:
 *   <form action={someServerAction}>
 *     <SubmitButton>送信</SubmitButton>
 *   </form>
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  style,
}: {
  children: React.ReactNode
  pendingLabel?: string
  className?: string
  style?: React.CSSProperties
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      style={style}
      aria-busy={pending}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Spinner />
          {pendingLabel ?? '処理中…'}
        </span>
      ) : (
        children
      )}
    </button>
  )
}

function Spinner() {
  return (
    <span
      className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
      aria-hidden="true"
    />
  )
}
