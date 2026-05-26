'use client'

import { useActionState } from 'react'
import type { Vehicle } from '@/lib/types'

type State = { error?: string } | undefined
type ActionFn = (prev: State, formData: FormData) => Promise<State>

export function VehicleForm({
  action,
  vehicle,
  submitLabel = '保存する',
}: {
  action: ActionFn
  vehicle?: Vehicle
  submitLabel?: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <Field
        name="model"
        label="車種"
        defaultValue={vehicle?.model ?? ''}
        placeholder="例：ハイエース ワイドミドル"
      />
      <Field
        name="plate_number"
        label="ナンバー"
        defaultValue={vehicle?.plate_number ?? ''}
        placeholder="例：品川 300 あ 12-34"
      />
      <Field
        name="first_registration_ym"
        label="初度登録年月"
        defaultValue={vehicle?.first_registration_ym ?? ''}
        placeholder="例：2021-04"
      />
      <Field
        name="inspection_expires_on"
        label="車検満了日 ★"
        type="date"
        defaultValue={vehicle?.inspection_expires_on ?? ''}
        hint="ここが入っていると、車検3ヶ月前から自動通知の対象になります（通知機能は次フェーズ）"
      />
      <Field
        name="purchased_on"
        label="購入日"
        type="date"
        defaultValue={vehicle?.purchased_on ?? ''}
      />
      <Field
        name="last_oil_change_on"
        label="前回オイル交換日"
        type="date"
        defaultValue={vehicle?.last_oil_change_on ?? ''}
      />

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {pending ? '保存中…' : submitLabel}
      </button>
    </form>
  )
}

function Field({
  name,
  label,
  type = 'text',
  defaultValue,
  placeholder,
  hint,
}: {
  name: string
  label: string
  type?: string
  defaultValue?: string
  placeholder?: string
  hint?: string
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
      />
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}
