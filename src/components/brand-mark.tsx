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
      <g transform="translate(256 256) scale(1.1) translate(-256 -256)">
        <path
          d="M128 288 C162 285 208 273 236 246 C254 228 268 215 292 214 C312 213 328 216 344 230 C364 247 380 270 379 299"
          fill="none"
          stroke="var(--theme-primary-fg)"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="364" cy="250" r="16" fill="var(--theme-accent)" />
      </g>
    </svg>
  );
}
