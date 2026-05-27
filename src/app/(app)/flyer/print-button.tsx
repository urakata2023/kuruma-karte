'use client'

/**
 * チラシ印刷ボタン。クリックで window.print() を呼ぶだけ。
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
    >
      🖨️ 印刷する
    </button>
  )
}
