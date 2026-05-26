import { generateQrSvg } from '@/lib/qr'

/**
 * テキスト/URLをQRコードSVGとしてサーバー側で描画。
 * Server Componentでのみ使用。
 */
export async function QrDisplay({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  const svg = await generateQrSvg(text)
  return (
    <div
      className={`inline-block rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-800 ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
