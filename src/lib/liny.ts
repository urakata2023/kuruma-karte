import 'server-only'

/**
 * Liny Open API 連携 (Phase C)
 *
 * 翔太さんが既に Liny で配信シナリオを組んでいる前提。
 * くるまカルテは「タグを付ける」だけのトリガー役。
 *   - 「車検3ヶ月前」「オイル交換時期」「新規登録」など
 *   - Liny 側の自動配信シナリオが発火 → LINE 配信
 *
 * Liny の Open API ドキュメントに沿って実装。
 * 注: 現時点では Liny API 仕様の正確な情報なしに動かないため、
 *      最小限のスケルトンのみ用意し、実装は翔太さんの API キー取得後に検証。
 */

export type LinyConfig = {
  apiKey: string | null
  workspaceId: string | null
}

/**
 * Liny にタグを付与する (友だちに対して)。
 *
 * 実装はキー取得 + ドキュメント確認後に詰める。
 * 現状は config が無ければスキップ、ある場合はログだけ出して未実装エラー。
 */
export async function applyLinyTag(params: {
  config: LinyConfig
  lineUserId: string
  tag: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!params.config.apiKey) {
    console.log('[Liny] apiKey 未設定。スキップ:', params.tag)
    return { ok: true }
  }

  // TODO: 実 API エンドポイントが確定したらここで fetch する
  // const res = await fetch(`https://api.liny.example/v1/friends/${params.lineUserId}/tags`, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${params.config.apiKey}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({ tag: params.tag, workspace_id: params.config.workspaceId }),
  // })

  console.warn(
    '[Liny] API エンドポイント未確定のためスキップ (Phase C 後半で実装)'
  )
  return { ok: false, error: 'Liny API 仕様確認中' }
}

export const SUGGESTED_LINY_TAGS = [
  'kuruma-karte:registered', // 新規登録
  'kuruma-karte:inspection-3m', // 車検3ヶ月前
  'kuruma-karte:inspection-1m', // 車検1ヶ月前
  'kuruma-karte:inspection-2w', // 車検2週間前
  'kuruma-karte:oil-due', // オイル交換時期
  'kuruma-karte:dormant', // 休眠 (6ヶ月以上来店なし)
  'kuruma-karte:touring-attendee', // ツーリング参加者
] as const
