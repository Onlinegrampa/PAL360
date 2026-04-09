'use client'

import { useState, useEffect } from 'react'
import { Activity, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import FactFindWizard from '@/components/FactFindWizard'
import HealthDashboard from '@/components/HealthDashboard'

interface FactFindResult {
  id: number
  client_id: string
  age: number
  income_multiplier: number | null
  life_insurance_needed: number
  current_coverage: number
  protection_gap: number
  gap_percentage: number
  status: string
  created_at: string
}

export default function FactFindPage() {
  const { user } = useAuth()
  const [result, setResult] = useState<FactFindResult | null>(null)
  const [loadingExisting, setLoadingExisting] = useState(true)

  // On mount: check if client already has an assessment
  useEffect(() => {
    if (!user) return
    apiFetch<FactFindResult>('/fact-finds/current')
      .then(setResult)
      .catch(() => {
        // 404 = no existing assessment — that's fine, show the wizard
      })
      .finally(() => setLoadingExisting(false))
  }, [user])

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#002855] rounded-xl flex items-center justify-center">
            <Activity size={20} className="text-[#C9A84C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Health Check</h1>
            <p className="text-sm text-gray-500">Your protection gap analysis</p>
          </div>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mt-3">
          Answer 5 quick questions and we'll show you exactly how much life insurance
          you need — and whether your current policies cover it.
        </p>
      </div>

      {/* Content */}
      {loadingExisting ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#002855]" />
        </div>
      ) : result ? (
        <HealthDashboard
          data={result}
          onRecalculate={() => setResult(null)}
        />
      ) : (
        <FactFindWizard
          clientId={user?.client_id ?? ''}
          onComplete={setResult}
        />
      )}
    </div>
  )
}
