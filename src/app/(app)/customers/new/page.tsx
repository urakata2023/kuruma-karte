import Link from 'next/link'
import { CustomerForm } from '@/components/customer-form'
import { createCustomer } from '../actions'

export default function NewCustomerPage() {
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
      <CustomerForm action={createCustomer} submitLabel="登録する" />
    </main>
  )
}
