'use client'

import { useActionState, useState } from 'react'
import imageCompression from 'browser-image-compression'

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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      setPhotoPreview(null)
      return
    }

    setCompressing(true)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })
      // input.files を圧縮版に差し替え（送信時に圧縮版が送られる）
      const dt = new DataTransfer()
      dt.items.add(
        new File([compressed], compressed.name, { type: compressed.type })
      )
      e.target.files = dt.files
      setPhotoPreview(URL.createObjectURL(compressed))
    } catch (err) {
      console.error('画像圧縮失敗、元画像を使用します:', err)
      setPhotoPreview(URL.createObjectURL(file))
    } finally {
      setCompressing(false)
    }
  }

  return (
    <form
      action={formAction}
      className="space-y-6"
      encType="multipart/form-data"
    >
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

        {/* 愛車の写真（任意） */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            愛車の写真
            <span className="ml-2 text-xs font-normal text-zinc-500">
              （任意・後から追加可能）
            </span>
          </label>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt="愛車プレビュー"
                className="h-full w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/default-vehicle.svg"
                alt="愛車（写真未登録）"
                className="h-full w-full object-cover"
              />
            )}
            {compressing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
                画像を準備中…
              </div>
            )}
          </div>
          <input
            type="file"
            name="photo"
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={compressing}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800 disabled:opacity-50 dark:file:bg-white dark:file:text-black"
          />
          <p className="text-xs text-zinc-500">
            ※ 写真は自動で圧縮されます。スマホで撮ったままで大丈夫です
          </p>
        </div>

        <Field
          name="model"
          label="車種"
          placeholder="例：ハイエース ワイドミドル"
        />
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
        disabled={pending || compressing}
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
