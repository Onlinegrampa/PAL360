'use client'

import { useEffect, useState, useRef } from 'react'
import { ClaimsPipeline } from '@/components/ClaimsPipeline'
import { ClaimSkeleton } from '@/components/Skeleton'
import { apiFetch, wsUrl } from '@/lib/api'
import type { Claim } from '@/lib/types'

const STAGES = ['Submitted', 'Agent Review', 'Claims Dept', 'Finance', 'Paid']

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    apiFetch<Claim[]>('/claims')
      .then((data) => {
        setClaims(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // WebSocket: connect to first active claim for real-time updates
  useEffect(() => {
    if (!claims.length) return
    const activeClaim = claims.find((c) => c.stage !== 'Paid')
    if (!activeClaim) return

    const ws = new WebSocket(wsUrl(`/ws/claims/${activeClaim.claim_id}`))
    wsRef.current = ws

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data)
      setClaims((prev) =>
        prev.map((c) =>
          c.claim_id === update.claim_id ? { ...c, ...update } : c
        )
      )
    }

    return () => ws.close()
  }, [claims.length])

  return (
    <div className="max-w-4xl mx-auto animate-[fadeIn_0.4s_ease-out]">
      <div className="mb-6">
        <h1 className="text-[#002855] text-2xl md:text-3xl font-bold">Claims Tracker</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time status of your insurance claims</p>
      </div>

      {/* Stage legend */}
      <div className="pal-card p-4 mb-6 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max md:min-w-0 md:justify-between">
          {STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#002855]/10 flex items-center justify-center text-[#002855] text-xs font-bold">
                  {i + 1}
                </div>
                <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">{stage}</p>
              </div>
              {i < STAGES.length - 1 && (
                <div className="w-8 h-px bg-gray-200 mb-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <ClaimSkeleton key={i} />)}
        </div>
      ) : claims.length === 0 ? (
        <div className="pal-card p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500">No active claims</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <ClaimsPipeline key={claim.claim_id} claim={claim} stages={STAGES} />
          ))}
        </div>
      )}
    </div>
  )
}
