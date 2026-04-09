'use client'

import Link from 'next/link'
import { FileDown } from 'lucide-react'
import { daysUntil, formatCurrency } from '@/lib/utils'
import { getToken } from '@/lib/api'
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

  const downloadStatement = () => {
    const token = getToken()
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const url = `${base}/policies/${policy.policy_id}/statement`
    // Open in new tab with auth header isn't possible via <a> tag,
    // so we fetch the blob and trigger a download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const href = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = href
        a.download = `PAL360_Statement_${policy.policy_id}.pdf`
        a.click()
        URL.revokeObjectURL(href)
      })
  }

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

      <div className="flex items-center gap-2">
        {policy.status === 'IN-FORCE' && urgentPayment && (
          <Link
            href="/payment"
            className="flex-1 bg-[#C9A84C] text-[#002855] text-sm font-semibold py-2.5 px-4 rounded-xl text-center hover:bg-[#e0c06a] transition-colors"
          >
            Pay Now
          </Link>
        )}
        {policy.status === 'IN-FORCE' && !urgentPayment && (
          <Link
            href="/claims"
            className="flex-1 border border-[#002855]/20 text-[#002855] text-sm font-medium py-2.5 px-4 rounded-xl text-center hover:bg-[#002855]/5 transition-colors"
          >
            View Claims
          </Link>
        )}
        <button
          onClick={downloadStatement}
          className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-500 text-sm font-medium hover:bg-gray-50 hover:text-[#002855] transition-colors"
          title="Download Statement"
        >
          <FileDown size={15} />
          <span className="hidden sm:inline">Statement</span>
        </button>
      </div>
    </div>
  )
}
