'use client'

/**
 * 「事務的な"処理中…"」ではなく、デザインされたローディング表現 (Phase H)
 *
 * - 3つのドットが小さく弾むアニメーション
 * - ラベルはほんのり、迫力なく
 * - 待ち時間が「待ってる感」ではなく「準備されてる感」に
 *
 * 使い方:
 *   <LoadingOverlay label="アップロード中" />
 *   <LoadingOverlay /> (ラベルなしでもOK)
 *
 * 親要素 (オーバーレイ表現したい場合は absolute) の中に置く。
 */
export function LoadingOverlay({
  label,
  size = 'md',
}: {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const dotSize =
    size === 'sm' ? 'h-1.5 w-1.5' : size === 'lg' ? 'h-3 w-3' : 'h-2 w-2'
  const fontSize =
    size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'

  return (
    <div className="flex flex-col items-center gap-3" aria-busy aria-live="polite">
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
    </div>
  )
}
