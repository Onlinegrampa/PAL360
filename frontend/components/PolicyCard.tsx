'use client'

import Link from 'next/link'
import { daysUntil, formatCurrency } from '@/lib/utils'
import type { Policy } from '@/lib/types'

const LINE_ICONS: Record<string, string> = {
  Life: '🛡️',
  Health: '❤️‍🩹',
  Annuities: '📈',
  'PA&S': '🏠',
}

const STATUS_CLASSES: Record<string, string> = {
  'IN-FORCE': 'badge-inforce',
  LAPSED: 'badge-lapsed',
  PENDING: 'badge-pending',
}

export function PolicyCard({ policy }: { policy: Policy }) {
  const days = daysUntil(policy.due_date)
  const urgentPayment = days <= 14 && policy.status === 'IN-FORCE'

  return (
    <div className="pal-card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#002855]/8 flex items-center justify-center text-2xl">
            {LINE_ICONS[policy.line] ?? '📋'}
          </div>
          <div>
            <p className="text-[#002855] font-semibold">{policy.line} Insurance</p>
            <p className="text-gray-400 text-xs mt-0.5">{policy.policy_id}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_CLASSES[policy.status]}`}>
          {policy.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-gray-400 text-xs">Coverage</p>
          <p className="text-[#002855] font-semibold text-sm">{formatCurrency(policy.coverage_amount)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Premium</p>
          <p className="text-[#002855] font-semibold text-sm">{formatCurrency(policy.premium)}/yr</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Due In</p>
          <p className={`font-semibold text-sm ${urgentPayment ? 'text-amber-600' : 'text-[#002855]'}`}>
            {days < 0 ? 'Overdue' : `${days}d`}
          </p>
        </div>
      </div>

      {policy.status === 'IN-FORCE' && (
        <div className="flex items-center gap-2">
          {urgentPayment && (
            <Link
              href="/payment"
              className="flex-1 bg-[#C9A84C] text-[#002855] text-sm font-semibold py-2.5 px-4 rounded-xl text-center hover:bg-[#e0c06a] transition-colors"
            >
              Pay Now
            </Link>
          )}
          <Link
            href="/claims"
            className="flex-1 border border-[#002855]/20 text-[#002855] text-sm font-medium py-2.5 px-4 rounded-xl text-center hover:bg-[#002855]/5 transition-colors"
          >
            View Claims
          </Link>
        </div>
      )}
    </div>
  )
}
