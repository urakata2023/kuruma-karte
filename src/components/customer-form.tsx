'use client'

import { useActionState } from 'react'
import type { Customer } from '@/lib/types'
import { SubmitButton } from '@/components/submit-button'

type State = { error?: string } | undefined
type ActionFn = (prev: State, formData: FormData) => Promise<State>

export function CustomerForm({
  action,
  customer,
  submitLabel = '保存する',
}: {
  action: ActionFn
  customer?: Customer
  submitLabel?: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <Field
        name="name"
        label="お名前"
        required
        defaultValue={customer?.name ?? ''}
        placeholder="例：田中 太郎"
      />
      <Field
        name="phone"
        label="電話番号"
        defaultValue={customer?.phone ?? ''}
        placeholder="例：09012345678"
      />
      <Field
        name="email"
        label="メールアドレス"
        type="email"
        defaultValue={customer?.email ?? ''}
        placeholder="例：taro@example.com"
      />
      <div className="space-y-1">
        <label htmlFor="memo" className="block text-sm font-medium">
          メモ
        </label>
        <textarea
          id="memo"
          name="memo"
          rows={3}
          defaultValue={customer?.memo ?? ''}
          placeholder="任意。要望や前回整備の内容など"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
        />
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

function Field({
  name,
  label,
  type = 'text',
  required,
  defaultValue,
  placeholder,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  defaultValue?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && ' *'}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
      />
    </div>
  )
}
