'use client'

import { useActionState } from 'react'
import type { MaintenanceRecord } from '@/lib/types'
import { MaintenanceTemplatePicker } from '@/components/maintenance-template-picker'
import { SubmitButton } from '@/components/submit-button'

type State = { error?: string } | undefined
type ActionFn = (prev: State, formData: FormData) => Promise<State>

const TITLE_PRESETS = [
  '車検',
  '12ヶ月点検',
  '6ヶ月点検',
  'オイル交換',
  'タイヤ交換',
  'バッテリー交換',
  'ブレーキパッド交換',
  'エアコン整備',
  '一般整備',
] as const

export function MaintenanceForm({
  action,
  record,
  submitLabel = '記録する',
}: {
  action: ActionFn
  record?: MaintenanceRecord
  submitLabel?: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <form action={formAction} className="space-y-4">
      {/* 整備テンプレート (新規登録時のみ) */}
      {!record && <MaintenanceTemplatePicker />}

      <div className="space-y-1">
        <label htmlFor="title" className="block text-sm font-medium">
          整備内容 *
        </label>
        <input
          id="title"
          name="title"
          required
          list="maintenance-title-presets"
          defaultValue={record?.title ?? ''}
          placeholder="例：車検、オイル交換、定期点検"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
        <datalist id="maintenance-title-presets">
          {TITLE_PRESETS.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <p className="text-xs text-zinc-500">
          入力欄をクリックするとよく使う項目が候補で出ます
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="performed_on" className="block text-sm font-medium">
            整備日 *
          </label>
          <input
            id="performed_on"
            name="performed_on"
            type="date"
            required
            defaultValue={record?.performed_on ?? todayStr}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="mileage_km" className="block text-sm font-medium">
            走行距離（km）
          </label>
          <input
            id="mileage_km"
            name="mileage_km"
            type="number"
            min="0"
            inputMode="numeric"
            defaultValue={record?.mileage_km ?? ''}
            placeholder="例：35000"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium">
          整備内容のメモ
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={record?.description ?? ''}
          placeholder="作業内容や所見など。お客様のマイページにも表示されます。"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="parts" className="block text-sm font-medium">
          交換した部品
        </label>
        <textarea
          id="parts"
          name="parts"
          rows={2}
          defaultValue={record?.parts ?? ''}
          placeholder="例：エンジンオイル 4L / オイルフィルター / ワイパーゴム 前後"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="cost" className="block text-sm font-medium">
          費用（円）
        </label>
        <input
          id="cost"
          name="cost"
          type="number"
          min="0"
          inputMode="numeric"
          defaultValue={record?.cost ?? ''}
          placeholder="例：12000"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
        <p className="text-xs text-zinc-500">
          ※ お客様マイページにも表示されます（空白なら非表示）
        </p>
      </div>

      {/* Before / After 写真 (Phase A) */}
      <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium">📸 整備前 / 整備後の写真（任意）</p>
        <p className="text-xs text-zinc-500">
          お客様マイページに Before / After で並べて表示されます。信頼感アップ。
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="before_photo" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              整備前 (Before)
            </label>
            {record?.before_photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={record.before_photo_url}
                alt="整備前"
                className="block aspect-[4/3] w-full rounded-md object-cover"
              />
            )}
            <input
              id="before_photo"
              name="before_photo"
              type="file"
              accept="image/*,.heic,.heif"
              className="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-zinc-900 file:px-2 file:py-1 file:text-[10px] file:font-medium file:text-white hover:file:bg-zinc-800 dark:file:bg-white dark:file:text-black"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="after_photo" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              整備後 (After)
            </label>
            {record?.after_photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={record.after_photo_url}
                alt="整備後"
                className="block aspect-[4/3] w-full rounded-md object-cover"
              />
            )}
            <input
              id="after_photo"
              name="after_photo"
              type="file"
              accept="image/*,.heic,.heif"
              className="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-zinc-900 file:px-2 file:py-1 file:text-[10px] file:font-medium file:text-white hover:file:bg-zinc-800 dark:file:bg-white dark:file:text-black"
            />
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <SubmitButton
        pending={pending}
        pendingLabel="保存中"
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {submitLabel}
      </SubmitButton>
    </form>
  )
}
