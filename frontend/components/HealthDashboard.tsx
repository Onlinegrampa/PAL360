'use client'

import { CheckCircle, AlertCircle, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react'

interface FactFindResult {
  life_insurance_needed: number
  current_coverage: number
  protection_gap: number
  gap_percentage: number
  status: string
  created_at?: string
}

interface Props {
  data: FactFindResult
  onRecalculate: () => void
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `TTD ${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `TTD ${Math.round(n / 1_000)}K`
  return `TTD ${Math.round(n)}`
}

function CoverageBar({ current, needed }: { current: number; needed: number }) {
  const pct = needed > 0 ? Math.min(100, (current / needed) * 100) : 0
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-gray-500 font-medium">
        <span>Current Coverage</span>
        <span>Recommended</span>
      </div>
      <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
        {/* Covered portion */}
        <div
          className="absolute left-0 top-0 h-full bg-[#002855] rounded-full transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
        {/* Gap marker */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow z-10">
            {pct.toFixed(0)}% covered
          </span>
        </div>
      </div>
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-[#002855]">{fmt(current)}</span>
        <span className="text-gray-500">{fmt(needed)}</span>
      </div>
    </div>
  )
}

export default function HealthDashboard({ data, onRecalculate }: Props) {
  const { life_insurance_needed, current_coverage, protection_gap, gap_percentage } = data

  const coveredPct = Math.max(0, Math.min(100, 100 - gap_percentage))

  const statusMap = {
    low_gap: {
      color:      'text-emerald-600',
      bg:         'bg-emerald-50',
      border:     'border-emerald-200',
      gapColor:   'text-emerald-600',
      gapBg:      'bg-emerald-50 border-emerald-200',
      icon:       CheckCircle,
      iconColor:  'text-emerald-500',
      label:      'Well Protected',
      message:    "Great news — your coverage is strong. Review regularly as your life changes.",
    },
    medium_gap: {
      color:      'text-amber-600',
      bg:         'bg-amber-50',
      border:     'border-amber-200',
      gapColor:   'text-amber-600',
      gapBg:      'bg-amber-50 border-amber-200',
      icon:       AlertTriangle,
      iconColor:  'text-amber-500',
      label:      'Moderate Gap',
      message:    "You have some coverage but there's room to strengthen your protection.",
    },
    high_gap: {
      color:      'text-red-600',
      bg:         'bg-red-50',
      border:     'border-red-200',
      gapColor:   'text-red-600',
      gapBg:      'bg-red-50 border-red-200',
      icon:       AlertCircle,
      iconColor:  'text-red-500',
      label:      'High Gap',
      message:    "Your family could face a significant shortfall. Consider increasing your coverage.",
    },
  }

  const config = statusMap[data.status as keyof typeof statusMap] ?? statusMap.high_gap

  const StatusIcon = config.icon

  return (
    <div className="space-y-5">

      {/* Hero status card */}
      <div className={`rounded-2xl border-2 ${config.bg} ${config.border} p-6 md:p-8`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${config.color}`}>
              Protection Status
            </p>
            <div className={`text-6xl font-black ${config.color} leading-none`}>
              {coveredPct.toFixed(0)}%
            </div>
            <p className="text-gray-600 text-sm mt-2 font-medium">{config.label}</p>
          </div>
          <StatusIcon size={56} className={config.iconColor} strokeWidth={1.5} />
        </div>
        <p className="text-gray-600 text-sm mt-4 leading-relaxed">{config.message}</p>
      </div>

      {/* Coverage bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
          Coverage Breakdown
        </h3>
        <CoverageBar current={current_coverage} needed={life_insurance_needed} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">
            Current
          </p>
          <p className="text-lg font-black text-[#002855] leading-tight">
            {fmt(current_coverage)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">you have</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">
            Needed
          </p>
          <p className="text-lg font-black text-gray-700 leading-tight">
            {fmt(life_insurance_needed)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">recommended</p>
        </div>

        <div className={`rounded-2xl border p-4 ${config.gapBg}`}>
          <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${config.gapColor}`}>
            Gap
          </p>
          <p className={`text-lg font-black leading-tight ${config.gapColor}`}>
            {protection_gap > 0 ? fmt(protection_gap) : 'None'}
          </p>
          <p className={`text-xs mt-0.5 ${config.gapColor} opacity-70`}>to fill</p>
        </div>
      </div>

      {/* DIME method explanation */}
      <div className="bg-[#002855]/5 rounded-2xl border border-[#002855]/10 p-5">
        <p className="text-xs font-bold text-[#002855] uppercase tracking-wider mb-3">
          How we calculated this
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">
          We used the <strong>DIME method</strong> — an industry-standard formula:
          <br />
          <span className="font-mono text-[#002855]">
            Debt + (Income × 10) + (Expenses × 10) + Final Expenses
          </span>
          <br />
          This estimates how much your family would need if you were no longer there.
        </p>
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a
          href="/products"
          className="flex items-center justify-center gap-2 py-3 px-5 bg-[#C9A84C] text-[#002855] rounded-xl font-bold hover:bg-[#C9A84C]/90 transition-all"
        >
          <TrendingUp size={18} />
          Explore Products
        </a>
        <button
          onClick={onRecalculate}
          className="flex items-center justify-center gap-2 py-3 px-5 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all"
        >
          <RefreshCw size={18} />
          Recalculate
        </button>
      </div>
    </div>
  )
}
