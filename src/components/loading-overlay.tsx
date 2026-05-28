'use client'

/**
 * 「事務的な"処理中…"」ではなく、デザインされたローディング表現 (Phase H+L)
 *
 * - 3つのドットが小さく弾むアニメーション
 * - 必要に応じてプログレスバー (進捗％) 表示
 */
export function LoadingOverlay({
  label,
  size = 'md',
  progress,
}: {
  label?: string
  size?: 'sm' | 'md' | 'lg'
  progress?: number // 0-100、指定するとプログレスバー表示
}) {
  const dotSize =
    size === 'sm' ? 'h-1.5 w-1.5' : size === 'lg' ? 'h-3 w-3' : 'h-2 w-2'
  const fontSize =
    size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'

  return (
    <div
      className="flex flex-col items-center gap-3"
      aria-busy
      aria-live="polite"
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`${dotSize} rounded-full bg-current opacity-80 animate-[karte-bounce_0.9s_ease-in-out_infinite]`}
          style={{ animationDelay: '0ms' }}
        />
        <span
          className={`${dotSize} rounded-full bg-current opacity-80 animate-[karte-bounce_0.9s_ease-in-out_infinite]`}
          style={{ animationDelay: '160ms' }}
        />
        <span
          className={`${dotSize} rounded-full bg-current opacity-80 animate-[karte-bounce_0.9s_ease-in-out_infinite]`}
          style={{ animationDelay: '320ms' }}
        />
      </div>
      {label && (
        <p className={`${fontSize} font-medium tracking-wide opacity-80`}>
          {label}
        </p>
      )}
      {typeof progress === 'number' && (
        <div className="w-48 max-w-full overflow-hidden rounded-full bg-current/10">
          <div
            className="h-1 rounded-full bg-current transition-all duration-300 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  )
}
