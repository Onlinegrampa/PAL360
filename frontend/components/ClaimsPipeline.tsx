'use client'

import { formatCurrency } from '@/lib/utils'
import type { Claim } from '@/lib/types'

export function ClaimsPipeline({
  claim,
  stages,
}: {
  claim: Claim
  stages: string[]
}) {
  const currentStageIdx = stages.indexOf(claim.stage)

  return (
    <div className="pal-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[#002855] font-semibold">{claim.description}</p>
          <p className="text-gray-400 text-xs mt-0.5">{claim.claim_id} · {formatCurrency(claim.amount)}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          claim.stage === 'Paid'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {claim.stage}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-1.5">
          {stages.map((stage, i) => (
            <div
              key={stage}
              className={`flex-1 text-center text-xs font-medium transition-colors ${
                i <= currentStageIdx ? 'text-[#002855]' : 'text-gray-300'
              }`}
            >
              <div
                className={`h-1.5 rounded-full mb-1 transition-colors ${
                  i <= currentStageIdx ? 'bg-[#002855]' : 'bg-gray-100'
                } ${i === 0 ? 'rounded-l-full' : ''} ${i === stages.length - 1 ? 'rounded-r-full' : ''}`}
              />
              <span className="hidden md:inline">{stage}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timestamps */}
      <div className="space-y-1.5">
        {claim.timestamps.map((ts) => (
          <div key={ts.stage} className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{ts.stage}</span>
            <span className="text-gray-400 font-mono">{new Date(ts.ts).toLocaleDateString()}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
        <span className="text-gray-400">Est. Resolution</span>
        <span className="text-[#002855] font-medium">{new Date(claim.est_resolution).toLocaleDateString()}</span>
      </div>
    </div>
  )
}
