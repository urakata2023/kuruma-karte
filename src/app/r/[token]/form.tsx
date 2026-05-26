'use client'

import { useActionState } from 'react'

type State = { error?: string } | undefined
type ActionFn = (prev: State, formData: FormData) => Promise<State>

export function PublicRegistrationForm({
  action,
  shopName,
}: {
  action: ActionFn
  shopName: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="space-y-5">
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold">あなたの情報</legend>
        <Field name="name" label="お名前" required placeholder="例：田中 太郎" />
        <Field
          name="phone"
          label="電話番号"
          type="tel"
          placeholder="例：09012345678"
          hint="車検のご相談の際に連絡させていただきます"
        />
        <Field
          name="email"
          label="メールアドレス"
          type="email"
          required
          placeholder="例：taro@example.com"
          hint="車検時期のお知らせをこちらに送ります"
        />
      </fieldset>

      <fieldset className="space-y-4 border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <legend className="text-base font-semibold">愛車の情報</legend>
        <Field name="model" label="車種" placeholder="例：ハイエース ワイドミドル" />
        <Field
          name="plate_number"
          label="ナンバー"
          placeholder="例：品川 300 あ 12-34"
        />
        <Field
          name="inspection_expires_on"
          label="車検満了日"
          type="date"
          hint="車検証に記載されている満了日をご入力ください"
        />
      </fieldset>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {pending ? '登録中…' : `${shopName}に登録する`}
      </button>

      <p className="text-center text-xs text-zinc-500">
        登録すると、{shopName}があなたの車検時期などをお知らせできるようになります。
      </p>
    </form>
  )
}

function Field({
  name,
  label,
  type = 'text',
  required,
  placeholder,
  hint,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  placeholder?: string
  hint?: string
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
        placeholder={placeholder}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-base focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
      />
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}
