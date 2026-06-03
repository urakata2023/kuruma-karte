'use client'

import { useState } from 'react'

/**
 * 「お客さんを追加」画面に置く、お客様自身の自己登録フローの案内。
 * 手入力しなくても、登録用URL（/r/[token]）をLINE等で送れば
 * お客様一人ひとりが同じURLから別々に登録できる、という導線。
 */
export function SelfRegisterCallout({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // クリップボード非対応環境では何もしない（URLは表示済み）
    }
  }

  return (
    <section
      className="mb-6 rounded-xl border p-4"
      style={{
        background: 'var(--surface-1)',
        borderColor: 'var(--hairline)',
      }}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-lg leading-none" aria-hidden>
          💡
        </span>
        <div className="min-w-0 flex-1">
          <h2
            className="text-sm font-semibold"
            style={{ color: 'var(--ink)' }}
          >
            お客さま自身に登録してもらう方法もあります
          </h2>
          <p
            className="mt-1 text-xs leading-relaxed"
            style={{ color: 'var(--ink-subtle)' }}
          >
            手入力しなくても大丈夫です。LINEなどで下の
            <strong style={{ color: 'var(--ink)' }}>登録用URL</strong>
            を送るだけ。
            <strong style={{ color: 'var(--ink)' }}>
              同じURLから、お客さま一人ひとりが別々に
            </strong>
            ご自分の愛車を登録できます。
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code
              className="min-w-0 flex-1 break-all rounded-md px-3 py-2 font-mono text-xs"
              style={{
                background: 'var(--surface-2)',
                color: 'var(--ink-muted)',
              }}
            >
              {url}
            </code>
            <button
              type="button"
              onClick={copy}
              className="shrink-0 rounded-md px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-90"
              style={{
                background: 'var(--theme-primary)',
                color: 'var(--theme-primary-fg)',
              }}
            >
              {copied ? '✓ コピーしました' : 'URLをコピー'}
            </button>
          </div>

          <p
            className="mt-2 text-[11px]"
            style={{ color: 'var(--ink-tertiary)' }}
          >
            ※ QRコードで渡したい場合はダッシュボードに表示されます。このURLは推測されないランダムな値です。
          </p>
        </div>
      </div>
    </section>
  )
}
