'use client'

import { ConfirmDeleteForm } from '@/components/confirm-delete-form'
import { removeMember } from './actions'

type Member = {
  id: string
  user_id: string
  role: 'owner' | 'staff'
  display_name: string | null
  created_at: string
  email?: string | null
}

export function MemberRow({ member }: { member: Member }) {
  return (
    <li className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 last:border-b-0 dark:border-zinc-800">
      <div>
        <p className="text-sm font-semibold">
          {member.display_name ?? member.email ?? member.user_id.slice(0, 8)}
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              member.role === 'owner'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            {member.role === 'owner' ? '👑 オーナー' : '👤 スタッフ'}
          </span>
        </p>
        {member.email && (
          <p className="mt-0.5 text-xs text-zinc-500">{member.email}</p>
        )}
      </div>

      {member.role !== 'owner' && (
        <ConfirmDeleteForm
          action={removeMember.bind(null, member.id)}
          label={member.display_name ?? member.email ?? 'このスタッフ'}
          className="text-xs font-medium text-red-600 hover:underline"
        />
      )}
    </li>
  )
}
