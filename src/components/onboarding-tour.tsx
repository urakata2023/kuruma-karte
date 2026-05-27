'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'kuruma-onboarding-done-v1'

type Step = {
  title: string
  body: string
  icon: string
}

const STEPS: Step[] = [
  {
    icon: '🚗',
    title: 'これは「あなたの愛車」のページです',
    body: 'あなたの大切な車の情報を、いつでもスマホで見られる場所です。お店からの大事なお知らせもここに届きます。',
  },
  {
    icon: '🔔',
    title: '車検時期は自動でお知らせ',
    body: '車検の3ヶ月前・1ヶ月前・2週間前に、お店から自動でメッセージが届きます。「忘れた！」がもう起きません。',
  },
  {
    icon: '📸',
    title: '思い出も整備記録も、ここに',
    body: '愛車との写真、ツーリングの記録、整備した内容まで全部ここに残せます。スワイプして眺めてみてください。',
  },
]

/**
 * 初回マイページ訪問時のオンボーディングツアー (3ステップ)
 *
 * - localStorage で完了フラグを記録 (2回目以降は出ない)
 * - URLに ?welcome=1 が付いてたら強制表示 (登録直後の遷移)
 * - 完了/スキップで閉じる
 */
export function OnboardingTour({ autoStart = false }: { autoStart?: boolean }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // ?welcome=1 で来た場合は強制表示
    const url = new URL(window.location.href)
    if (autoStart || url.searchParams.get('welcome') === '1') {
      const done = window.localStorage.getItem(STORAGE_KEY)
      if (!done) setOpen(true)
    }
  }, [autoStart])

  function close() {
    setOpen(false)
    try {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    } catch {
      // ignore
    }
    // URL から ?welcome=1 を取り除く
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.searchParams.has('welcome')) {
        url.searchParams.delete('welcome')
        window.history.replaceState({}, '', url.toString())
      }
    }
  }

  function next() {
    if (step >= STEPS.length - 1) {
      close()
    } else {
      setStep((s) => s + 1)
    }
  }

  if (!open) return null

  const current = STEPS[step]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div
        className="w-full max-w-md space-y-5 rounded-2xl p-6 shadow-2xl sm:p-8"
        style={{
          background: 'var(--theme-surface, white)',
          color: 'var(--foreground, #18181b)',
          borderColor: 'var(--theme-surface-border, #e4e4e7)',
          borderWidth: 1,
          borderStyle: 'solid',
        }}
      >
        {/* プログレスドット */}
        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === step ? '28px' : '8px',
                background:
                  i === step
                    ? 'var(--theme-accent, #2563eb)'
                    : 'color-mix(in srgb, currentColor 20%, transparent)',
              }}
            />
          ))}
        </div>

        <div className="text-center">
          <div className="text-5xl">{current.icon}</div>
          <h2 className="mt-4 text-lg font-semibold">{current.title}</h2>
          <p className="mt-3 text-sm opacity-80">{current.body}</p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={close}
            className="text-xs opacity-60 hover:opacity-100"
          >
            スキップ
          </button>

          <button
            type="button"
            onClick={next}
            className="rounded-full px-6 py-2.5 text-sm font-semibold"
            style={{
              background: 'var(--theme-primary, #18181b)',
              color: 'var(--theme-primary-fg, white)',
            }}
          >
            {step < STEPS.length - 1
              ? `次へ（${step + 1}/${STEPS.length}）`
              : '始める ✨'}
          </button>
        </div>
      </div>
    </div>
  )
}
