import Link from 'next/link'
import { CustomerForm } from '@/components/customer-form'
import { SelfRegisterCallout } from '@/components/self-register-callout'
import { getCurrentShop } from '@/lib/shop'
import { createCustomer } from '../actions'

export default async function NewCustomerPage() {
  const { shop } = await getCurrentShop()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const registrationUrl = `${appUrl}/r/${shop.registration_token}`

  return (
    <main className="mx-auto w-full max-w-md px-6 py-10">
      <div className="mb-6">
        <Link
          href="/customers"
          className="text-sm text-zinc-500 hover:underline"
        >
          ← お客さん一覧
        </Link>
        <h1 className="mt-2 text-xl font-semibold">お客さんを追加</h1>
      </div>
      <SelfRegisterCallout url={registrationUrl} />
      <CustomerForm action={createCustomer} submitLabel="登録する" />
    </main>
  )
}
