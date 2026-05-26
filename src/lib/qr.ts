import 'server-only'
import QRCode from 'qrcode'

/**
 * 任意のテキスト/URLからQRコードのSVG文字列を生成。
 * Server Component から呼んで dangerouslySetInnerHTML で表示。
 */
export async function generateQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    margin: 1,
    width: 240,
    color: { dark: '#000000', light: '#ffffff' },
  })
}
