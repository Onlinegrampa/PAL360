'use client'

import { useState } from 'react'
import { Calculator, Loader2, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface QuoteResult {
  product_line: string
  age: number
  sex?: string
  smoker?: boolean
  coverage_amount?: number
  annual: number
  monthly: number
  rate_per_1k?: number
  note?: string
}

const PA_TIERS = [
  { tier_id: 'pa-std',   name: 'Personal Protector Standard', annual: 780,  monthly: 66.95,  description: 'Core personal accident protection' },
  { tier_id: 'pa-plus',  name: 'Personal Protector Plus',     annual: 1560, monthly: 133.90, description: 'Enhanced cover with additional benefits' },
  { tier_id: 'pa-total', name: 'Total Protector',             annual: 1620, monthly: 139.05, description: 'Comprehensive all-in-one package' },
]

interface Props {
  productId: string
  productLine: string   // "Life" | "Health" | "Annuities" | "PA&S"
}

function fmt(n: number) {
  return `TTD ${n.toLocaleString('en-TT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function QuoteWidget({ productId, productLine }: Props) {
  const router = useRouter()
  const [dob, setDob] = useState('')
  const [sex, setSex] = useState<'F' | 'M'>('F')
  const [smoker, setSmoker] = useState(false)
  const [coverage, setCoverage] = useState('')
  const [selectedTier, setSelectedTier] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QuoteResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isLifeOrHealth = productLine === 'Life' || productLine === 'Health'

  // Max DOB = 18 years ago; min DOB = 80 years ago
  const today = new Date()
  const maxDob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
    .toISOString().split('T')[0]
  const minDob = new Date(today.getFullYear() - 80, today.getMonth(), today.getDate())
    .toISOString().split('T')[0]

  const canQuote = () => {
    // PA&S is flat-rate — DOB optional, just need a tier selected
    if (productLine === 'PA&S') return selectedTier !== ''
    // Life and Health require DOB (age-rated)
    if (!dob) return false
    if (productLine === 'Life') return coverage !== '' && parseFloat(coverage) > 0
    return true  // Health
  }

  const handleGetQuote = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const body: Record<string, unknown> = { product_line: productLine, sex, smoker, date_of_birth: dob }
      if (isLifeOrHealth) body.coverage_amount = parseFloat(coverage) || 0
      if (productLine === 'PA&S') body.pa_tier_id = selectedTier
      const data = await apiFetch<QuoteResult>('/quotes/calculate', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quote failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (!result) return
    const p = new URLSearchParams()
    if (result.monthly)          p.set('premium_monthly', String(result.monthly))
    if (result.annual)           p.set('premium_annual',  String(result.annual))
    if (result.coverage_amount)  p.set('coverage',        String(result.coverage_amount))
    if (result.sex)              p.set('sex',              result.sex)
    if (dob)                     p.set('dob',              dob)
    router.push(`/products/${productId}/apply?${p.toString()}`)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#C9A84C]/15 rounded-lg flex items-center justify-center">
          <Calculator size={16} className="text-[#C9A84C]" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Get a Quote</h3>
          <p className="text-xs text-gray-400">Indicative — final premium subject to underwriting</p>
        </div>
      </div>

      {/* DOB — shown for all age-rated product lines */}
      {productLine !== 'Annuities' && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Date of Birth
            {isLifeOrHealth && <span className="text-red-400 ml-1">*</span>}
          </label>
          <input
            type="date"
            min={minDob}
            max={maxDob}
            value={dob}
            onChange={e => { setDob(e.target.value); setResult(null) }}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#002855]"
          />
          {dob && (
            <p className="text-xs text-gray-400">
              Age: <span className="font-semibold text-[#002855]">
                {new Date().getFullYear() - new Date(dob).getFullYear() -
                  (new Date() < new Date(new Date(dob).setFullYear(new Date().getFullYear())) ? 1 : 0)} years
              </span>
            </p>
          )}
        </div>
      )}

      {/* Inputs — Life / Health */}
      {isLifeOrHealth && (
        <div className="space-y-4">
          {/* Sex */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sex at birth</label>
            <div className="flex gap-2">
              {(['F', 'M'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSex(v)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    sex === v
                      ? 'bg-[#002855] text-white border-[#002855]'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-[#002855]/40'
                  }`}
                >
                  {v === 'F' ? 'Female' : 'Male'}
                </button>
              ))}
            </div>
          </div>

          {/* Smoker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Do you smoke?</label>
            <div className="flex gap-2">
              {([false, true] as const).map(v => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setSmoker(v)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    smoker === v
                      ? 'bg-[#002855] text-white border-[#002855]'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-[#002855]/40'
                  }`}
                >
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          {/* Coverage amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Coverage amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">TTD</span>
              <input
                type="number"
                min="0"
                step="50000"
                placeholder="e.g. 500000"
                value={coverage}
                onChange={e => setCoverage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canQuote() && handleGetQuote()}
                className="w-full border border-gray-300 rounded-xl py-3 pl-16 pr-4 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#002855]"
              />
            </div>
          </div>
        </div>
      )}

      {/* PA&S tier picker */}
      {productLine === 'PA&S' && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select package</label>
          {PA_TIERS.map(tier => (
            <button
              key={tier.tier_id}
              type="button"
              onClick={() => setSelectedTier(tier.tier_id)}
              className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                selectedTier === tier.tier_id
                  ? 'border-[#002855] bg-[#002855]/5 ring-1 ring-[#002855]/20'
                  : 'border-gray-200 hover:border-[#002855]/30'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{tier.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{tier.description}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-[#002855]">{fmt(tier.annual)}/yr</p>
                  <p className="text-xs text-gray-400">{fmt(tier.monthly)}/mo</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Annuities — no rater */}
      {productLine === 'Annuities' && (
        <div className="bg-[#002855]/5 rounded-xl p-4 text-sm text-gray-600 leading-relaxed">
          Annuity illustrations are personalised based on your retirement goals.
          Apply below and an advisor will contact you with a detailed projection.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-600 leading-tight">{error}</p>
        </div>
      )}

      {/* Quote result */}
      {result && result.annual > 0 && (
        <div className="bg-[#002855]/5 border border-[#002855]/15 rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-bold text-[#002855] uppercase tracking-widest">Estimated Premium</p>
          <div className="flex items-end gap-5">
            <div>
              <p className="text-3xl font-black text-[#002855] leading-none">{fmt(result.monthly)}</p>
              <p className="text-xs text-gray-400 mt-1">per month</p>
            </div>
            <div className="pb-0.5">
              <p className="text-lg font-bold text-gray-500">{fmt(result.annual)}</p>
              <p className="text-xs text-gray-400">per year</p>
            </div>
          </div>
          {result.note && (
            <p className="text-xs text-gray-500 italic border-t border-[#002855]/10 pt-2">{result.note}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#C9A84C] text-[#002855] rounded-xl font-bold hover:bg-[#C9A84C]/90 transition-all"
            >
              <TrendingUp size={16} />
              Apply at this rate
            </button>
            <button
              onClick={() => { setResult(null); setError(null) }}
              className="p-3 border border-gray-300 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
              title="Recalculate"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Get Quote button */}
      {!result && productLine !== 'Annuities' && (
        <button
          onClick={handleGetQuote}
          disabled={!canQuote() || loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#002855] text-white rounded-xl font-semibold hover:bg-[#002855]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Calculating…</>
          ) : (
            <><Calculator size={16} /> Get Quote</>
          )}
        </button>
      )}

      {/* Annuities — go straight to apply */}
      {productLine === 'Annuities' && (
        <button
          onClick={() => router.push(`/products/${productId}/apply`)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#002855] text-white rounded-xl font-semibold hover:bg-[#002855]/90 transition-all"
        >
          <TrendingUp size={16} />
          Start Application
        </button>
      )}
    </div>
  )
}
