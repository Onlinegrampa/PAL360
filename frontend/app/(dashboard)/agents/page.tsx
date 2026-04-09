'use client'

import { useEffect, useState } from 'react'
import { Users, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import AgentCard, { type Agent } from '@/components/AgentCard'

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [requestedId, setRequestedId] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<Agent[]>('/agents')
      .then(setAgents)
      .catch(() => setAgents([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto animate-[fadeIn_0.4s_ease-out]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#002855] rounded-xl flex items-center justify-center">
            <Users size={20} className="text-[#C9A84C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Find Your Agent</h1>
            <p className="text-sm text-gray-500">Connect with a PAL360 advisor</p>
          </div>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mt-3">
          Our advisors are here to guide you through your insurance journey.
          Call, WhatsApp, or email any agent — or send a request and they'll reach out to you.
        </p>
      </div>

      {/* Success banner */}
      {requestedId && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-700 font-medium">
          ✓ Your request has been sent. An agent will contact you within 1 business day.
        </div>
      )}

      {/* Agent grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-[#002855]" />
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          No agents available at this time.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map(agent => (
            <AgentCard
              key={agent.agent_id}
              agent={agent}
              requestedId={requestedId}
              onRequested={setRequestedId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
