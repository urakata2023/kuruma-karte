'use client'

import { useFormStatus } from 'react-dom'

/**
 * Server Action フォーム用のサブミットボタン (Phase G+)
 *
 * useFormStatus で「送信中…」状態を自動取得し、
 * pending 中は disable + シマー光が流れるプレミアムローディング表示。
 *
 * 「処理中…」みたいなダサい事務的表現ではなく、
 * 高品質なSaaSらしい「光がボタン内を左→右にスーッと流れる」演出。
 *
 * 使い方:
 *   <form action={someServerAction}>
 *     <SubmitButton>送信</SubmitButton>
 *   </form>
 *
 * 親が pending を持ってる場合は props で渡せる:
 *   <SubmitButton pending={pending}>送信</SubmitButton>
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  style,
  pending: externalPending,
  type = 'submit',
  onClick,
}: {
  children: React.ReactNode
  pendingLabel?: string
  className?: string
  style?: React.CSSProperties
  pending?: boolean
  type?: 'submit' | 'button'
  onClick?: () => void
}) {
  const { pending: formStatusPending } = useFormStatus()
  const pending = externalPending ?? formStatusPending

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={pending}
      className={`relative overflow-hidden ${className ?? ''}`}
      style={style}
      aria-busy={pending}
    >
      {/* ラベル */}
      <span
        className="relative z-10 inline-flex items-center justify-center gap-2 transition-opacity duration-200"
        style={{ opacity: pending ? 0.85 : 1 }}
      >
        {pending ? (
          <>
            <Dots />
            {pendingLabel ?? children}
          </>
        ) : (
          children
        )}
      </span>

      {/* シマー光 (Pending 時のみ流れる) */}
      {pending && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
        >
          <span
            className="absolute inset-y-0 w-1/3 animate-[karte-shimmer_1.4s_linear_infinite]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
            }}
          />
        </span>
      )}
    </button>
  )
}

/**
 * 控えめな「●●●」ドット (フェードイン/アウトでさり気なく)
 */
function Dots() {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      <span
        className="h-1 w-1 rounded-full bg-current opacity-80 animate-[karte-bounce_0.9s_ease-in-out_infinite]"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="h-1 w-1 rounded-full bg-current opacity-80 animate-[karte-bounce_0.9s_ease-in-out_infinite]"
        style={{ animationDelay: '160ms' }}
      />
      <span
        className="h-1 w-1 rounded-full bg-current opacity-80 animate-[karte-bounce_0.9s_ease-in-out_infinite]"
        style={{ animationDelay: '320ms' }}
      />
    </span>
  )
}
