'use client'

import { Phone, Mail, MessageCircle, UserPlus, CheckCircle, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useState } from 'react'

export interface Agent {
  agent_id: string
  name: string
  title: string
  email: string
  phone: string
  whatsapp: string
  bio: string
  specialties: string[]
  photo_initials: string
}

interface Props {
  agent: Agent
  onRequested?: (agentId: string) => void
  requestedId?: string | null
}

export default function AgentCard({ agent, onRequested, requestedId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isRequested = requestedId === agent.agent_id

  const handleRequest = async () => {
    setLoading(true)
    setError(null)
    try {
      await apiFetch('/agents/request', {
        method: 'POST',
        body: JSON.stringify({ agent_id: agent.agent_id }),
      })
      onRequested?.(agent.agent_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Agent header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#002855] flex items-center justify-center flex-shrink-0">
          <span className="text-[#C9A84C] font-bold text-sm">{agent.photo_initials}</span>
        </div>
        <div>
          <p className="font-semibold text-gray-900">{agent.name}</p>
          <p className="text-xs text-gray-500">{agent.title}</p>
        </div>
      </div>

      {/* Bio */}
      <p className="text-sm text-gray-600 leading-relaxed">{agent.bio}</p>

      {/* Specialties */}
      <div className="flex flex-wrap gap-2">
        {agent.specialties.map(s => (
          <span
            key={s}
            className="px-2.5 py-1 bg-[#002855]/5 text-[#002855] text-xs font-medium rounded-full border border-[#002855]/10"
          >
            {s}
          </span>
        ))}
      </div>

      {/* Contact buttons */}
      <div className="grid grid-cols-3 gap-2">
        <a
          href={`tel:${agent.phone}`}
          className="flex flex-col items-center gap-1 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
        >
          <Phone size={16} className="text-[#002855]" />
          <span className="text-xs text-gray-600 font-medium">Call</span>
        </a>
        <a
          href={`https://wa.me/${agent.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 py-2.5 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors"
        >
          <MessageCircle size={16} className="text-green-600" />
          <span className="text-xs text-green-700 font-medium">WhatsApp</span>
        </a>
        <a
          href={`mailto:${agent.email}`}
          className="flex flex-col items-center gap-1 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
        >
          <Mail size={16} className="text-[#002855]" />
          <span className="text-xs text-gray-600 font-medium">Email</span>
        </a>
      </div>

      {/* Request button */}
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
      <button
        onClick={handleRequest}
        disabled={loading || !!requestedId}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
          isRequested
            ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
            : requestedId
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
            : 'bg-[#002855] text-white hover:bg-[#002855]/90'
        }`}
      >
        {loading ? (
          <><Loader2 size={15} className="animate-spin" /> Sending…</>
        ) : isRequested ? (
          <><CheckCircle size={15} /> Request Sent</>
        ) : (
          <><UserPlus size={15} /> Request This Agent</>
        )}
      </button>
    </div>
  )
}
