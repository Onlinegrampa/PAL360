'use client'

import { useEffect, useState } from 'react'
import { PolicyCard } from '@/components/PolicyCard'
import { PolicySkeleton } from '@/components/Skeleton'
import type { Policy } from '@/lib/types'

export default function DashboardPage() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [clientName, setClientName] = useState('Maria Rodriguez')

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/policies`)
      .then((r) => r.json())
      .then((data) => {
        setPolicies(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalAnnualPremium = policies
    .filter((p) => p.status === 'IN-FORCE')
    .reduce((sum, p) => sum + p.premium, 0)

  return (
    <div className="max-w-4xl mx-auto animate-[fadeIn_0.4s_ease-out]">
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-gray-500 text-sm">Welcome back,</p>
        <h1 className="text-[#002855] text-2xl md:text-3xl font-bold">{clientName}</h1>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <div className="pal-card p-4">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Active Policies</p>
          <p className="text-[#002855] text-2xl font-bold mt-1">
            {loading ? '—' : policies.filter((p) => p.status === 'IN-FORCE').length}
          </p>
        </div>
        <div className="pal-card p-4">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Annual Premium</p>
          <p className="text-[#002855] text-2xl font-bold mt-1">
            {loading ? '—' : `$${totalAnnualPremium.toLocaleString()}`}
          </p>
        </div>
        <div className="pal-card p-4 col-span-2 md:col-span-1">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Next Due</p>
          <p className="text-[#002855] text-2xl font-bold mt-1">
            {loading ? '—' : policies
              .filter((p) => p.status === 'IN-FORCE')
              .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0]
              ?.due_date.slice(0, 10) ?? '—'}
          </p>
        </div>
      </div>

      {/* Policy cards */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[#002855] font-semibold text-lg">Your Policies</h2>
        <span className="text-gray-400 text-sm">{loading ? '' : `${policies.length} policies`}</span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <PolicySkeleton key={i} />)}
        </div>
      ) : (
        <div className="space-y-4">
          {policies.map((policy) => (
            <PolicyCard key={policy.policy_id} policy={policy} />
          ))}
        </div>
      )}
    </div>
  )
}
