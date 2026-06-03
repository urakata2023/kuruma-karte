/**
 * くるまカルテ ブランドマーク（一筆書きの愛車シルエット＋灯）。
 * favicon / アプリアイコン（public/icon-*.svg, src/app/icon.svg）と同一パス。
 *
 * 色はテーマ変数に追従する：
 *   地     = --theme-primary
 *   車ライン = --theme-primary-fg（primary と必ずコントラストする前景色）
 *   灯（点） = --theme-accent
 * これにより rosso / heritage-gold / bavarian-blue など各テーマで自動的に馴染む。
 */
export function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      role="img"
      aria-label="くるまカルテ"
    >
      <rect width="512" height="512" rx="120" fill="var(--theme-primary)" />
      <g transform="translate(256 256) scale(1.12) translate(-256 -256)">
        <path
          d="M148 320 C158 302 178 300 196 306 C232 318 250 246 304 238 C344 232 360 252 368 298 C371 309 370 318 364 326"
          fill="none"
          stroke="var(--theme-primary-fg)"
          strokeWidth="26"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="361" cy="300" r="17" fill="var(--theme-accent)" />
      </g>
    </svg>
  );
}
