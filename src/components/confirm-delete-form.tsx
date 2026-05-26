'use client'

/**
 * 削除前にブラウザconfirmで確認を取るフォーム。
 * Server Actionをbindしてactionとして渡す。
 */
export function ConfirmDeleteForm({
  action,
  label,
  buttonLabel = '削除',
  className = 'text-sm font-medium text-red-600 hover:underline',
}: {
  action: () => Promise<void>
  label: string
  buttonLabel?: string
  className?: string
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`本当に削除しますか？\n${label}\n\n※元に戻せません。`)) {
          e.preventDefault()
        }
      }}
    >
      <button type="submit" className={className}>
        {buttonLabel}
      </button>
    </form>
  )
}
