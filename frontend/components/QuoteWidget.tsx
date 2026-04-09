'use client'

import { useState } from 'react'
import { Calculator, Loader2, AlertCircle, TrendingUp, RefreshCw } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface QuoteResult {
  product_line: string
  plan_code?: string
  plan_name?: string
  age: number
  sex?: string
  annual: number
  monthly: number
  net_rate?: number
  rate_per_unit?: number
  units?: number
  weekly_benefit?: number
  ep_label?: string
  coverage_type?: string
  plan_tier?: string
  plan?: string
  note?: string
}

// ── PA plan classification ────────────────────────────────────────────────────
const PA_NEEDS_SEX         = ['67C','67D','77B','CI','PP','LS-STD','LS-ENH','IS']
const PA_NEEDS_OCC_CLASS   = ['60A','61A','62A','62B','68A','78C','PP','IS']
const PA_TIER_LS           = ['LS-STD','LS-ENH']        // Platinum / Gold / Silver
const PA_TIER_SUPREME      = ['SFP-SP','SFP-FG']        // Plan I / II / III / IV
const PA_NEEDS_COV_TYPE    = ['CC-A','CC-B','CC-C']     // coverage type selector
const PA_FIXED_PRICE       = ['CCP-C']                  // no inputs — fixed rate
const PA_NO_COVERAGE       = ['PP','TP','SFP','SFP-SP','SFP-FG',
                              'CCP-C','CC-A','CC-B','CC-C','LS-STD','LS-ENH']

// Unisex Life plans
const UNISEX_PLANS = ['361','362','363','365','366','367']

// ESP durations
const ESP_DURATIONS = [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25]

// Coverage amount label / placeholder by plan
const PA_COVERAGE_META: Record<string, { label: string; placeholder: string; step: number }> = {
  '60A':  { label: 'Face Amount (TTD)',          placeholder: 'e.g. 70000',  step: 1000  },
  '61A':  { label: 'Total Benefit Amount (TTD)', placeholder: 'e.g. 5000',   step: 100   },
  '62A':  { label: 'Weekly Benefit (TTD)',        placeholder: 'e.g. 300',    step: 50    },
  '62B':  { label: 'Weekly Benefit (TTD)',        placeholder: 'e.g. 300',    step: 50    },
  '67C':  { label: 'Weekly Benefit (TTD)',        placeholder: 'e.g. 250',    step: 100   },
  '67D':  { label: 'Weekly Benefit (TTD)',        placeholder: 'e.g. 250',    step: 100   },
  '68A':  { label: 'Weekly Benefit (TTD)',        placeholder: 'e.g. 250',    step: 50    },
  '77B':  { label: 'Surgical Benefit (TTD)',      placeholder: 'e.g. 1700',   step: 1000  },
  '78C':  { label: 'Monthly Annuity (TTD)',       placeholder: 'e.g. 1100',   step: 1000  },
  '69L':  { label: 'Face Amount (TTD)',           placeholder: 'e.g. 25000',  step: 1000  },
  'CI':   { label: 'Benefit Amount (TTD)',        placeholder: 'e.g. 50000',  step: 1000  },
  'PP':   { label: 'Units (packages)',            placeholder: '1',           step: 1     },
  'TP':   { label: 'Units (packages)',            placeholder: '1',           step: 1     },
  'SFP':  { label: 'Units (per person)',          placeholder: '1',           step: 1     },
  'IS':   { label: 'Units (packages)',            placeholder: '1',           step: 1     },
}

const EP_OPTIONS = [
  { code: 'A_30_30',   label: '30-day EP (Sickness & Accident)' },
  { code: 'B_60_60',   label: '60-day EP (Sickness & Accident)' },
  { code: 'C_90_90',   label: '90-day EP (Sickness & Accident)' },
  { code: 'D_30S_0A',  label: '30-day S / 0-day A EP' },
  { code: 'E_60S_0A',  label: '60-day S / 0-day A EP' },
  { code: 'F_90S_0A',  label: '90-day S / 0-day A EP' },
  { code: 'G_30S_14A', label: '30-day S / 14-day A EP' },
  { code: 'H_60S_14A', label: '60-day S / 14-day A EP' },
  { code: 'I_90S_14A', label: '90-day S / 14-day A EP' },
]

interface Props {
  productId: string
  productLine: string
  planCode?: string
}

function fmt(n: number) {
  return `TTD ${n.toLocaleString('en-TT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function QuoteWidget({ productId, productLine, planCode = '' }: Props) {
  const router = useRouter()
  const [dob,          setDob]          = useState('')
  const [sex,          setSex]          = useState<'F'|'M'>('F')
  const [smoker,       setSmoker]       = useState(false)
  const [coverage,     setCoverage]     = useState('')
  const [occClass,     setOccClass]     = useState(1)
  const [planTier,     setPlanTier]     = useState('')
  const [coverageType, setCoverageType] = useState('Individual')
  const [epCode,       setEpCode]       = useState('G_30S_14A')
  const [espDuration,  setEspDuration]  = useState(15)
  const [loading,      setLoading]      = useState(false)
  const [result,       setResult]       = useState<QuoteResult | null>(null)
  const [error,        setError]        = useState<string | null>(null)

  const isLifeOrHealth = productLine === 'Life' || productLine === 'Health'
  const isESP          = planCode === '818'
  const isUnisex       = UNISEX_PLANS.includes(planCode)
  const isPAS          = productLine === 'PA&S'
  const isAnnuity      = productLine === 'Annuities'
  const isFixed        = isPAS && PA_FIXED_PRICE.includes(planCode)
  const needsOccClass  = isPAS && PA_NEEDS_OCC_CLASS.includes(planCode)
  const needsSex       = isPAS && PA_NEEDS_SEX.includes(planCode)
  const needsTierLS    = isPAS && PA_TIER_LS.includes(planCode)
  const needsTierSup   = isPAS && PA_TIER_SUPREME.includes(planCode)
  const needsCovType   = isPAS && PA_NEEDS_COV_TYPE.includes(planCode)
  const needsCoverage  = isPAS && !PA_NO_COVERAGE.includes(planCode)
  const needsEP        = isPAS && planCode === '68A'
  const paCovMeta      = PA_COVERAGE_META[planCode]

  const today  = new Date()
  const maxDob = new Date(today.getFullYear() - 1,  today.getMonth(), today.getDate()).toISOString().split('T')[0]
  const minDob = new Date(today.getFullYear() - 80, today.getMonth(), today.getDate()).toISOString().split('T')[0]

  const calcAge = (d: string) => {
    if (!d) return null
    const b = new Date(d)
    const age = today.getFullYear() - b.getFullYear() -
      (today < new Date(today.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0)
    return age
  }

  const canQuote = () => {
    if (isFixed)   return true
    if (isAnnuity) return true
    if (!dob)      return false
    if (isPAS) {
      if (needsTierLS  && !planTier) return false
      if (needsTierSup && !planTier) return false
      if (needsCoverage && (!coverage || parseFloat(coverage) <= 0)) return false
      return true
    }
    if (isLifeOrHealth) {
      if (productLine === 'Life') return coverage !== '' && parseFloat(coverage) > 0
      return true
    }
    return false
  }

  const handleGetQuote = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const body: Record<string, unknown> = {
        product_line: productLine,
        sex,
        smoker,
        date_of_birth: isFixed ? undefined : dob,
      }
      if (planCode)       body.plan_code      = planCode
      if (isLifeOrHealth) body.coverage_amount = parseFloat(coverage) || 0
      if (needsCoverage)  body.coverage_amount = parseFloat(coverage) || 0
      if (needsOccClass)  body.occ_class       = occClass
      if (needsTierLS || needsTierSup) body.plan_tier = planTier
      if (needsCovType)   body.coverage_type   = coverageType
      if (needsEP)        body.ep_code         = epCode
      if (isESP)          body.esp_duration    = espDuration

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
    if (result.monthly) p.set('premium_monthly', String(result.monthly))
    if (result.annual)  p.set('premium_annual',  String(result.annual))
    if (result.sex)     p.set('sex',              result.sex)
    if (dob)            p.set('dob',              dob)
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

      {/* Fixed price notice (e.g. CCP-C) */}
      {isFixed && (
        <div className="bg-[#002855]/5 rounded-xl p-3.5 text-sm text-gray-700 leading-relaxed">
          This plan has a fixed annual premium of <span className="font-bold text-[#002855]">TTD 4,944.00</span> / TTD 412.00 per month.
          Click below to get your quote.
        </div>
      )}

      {/* DOB input — all age-rated products */}
      {!isFixed && !isAnnuity && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {isESP ? 'Date of Birth (Payor)' : 'Date of Birth'}
            <span className="text-red-400 ml-1">*</span>
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
              Age: <span className="font-semibold text-[#002855]">{calcAge(dob)} years</span>
            </p>
          )}
        </div>
      )}

      {/* ── PA&S inputs ─────────────────────────────────────────── */}
      {isPAS && !isFixed && (
        <div className="space-y-4">

          {/* Sex — PA products that are sex-rated */}
          {needsSex && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sex at birth</label>
              <div className="flex gap-2">
                {(['F','M'] as const).map(v => (
                  <button key={v} type="button" onClick={() => setSex(v)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      sex === v ? 'bg-[#002855] text-white border-[#002855]'
                               : 'bg-white text-gray-600 border-gray-300 hover:border-[#002855]/40'}`}>
                    {v === 'F' ? 'Female' : 'Male'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Occupation class */}
          {needsOccClass && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Occupation Class</label>
              <select
                value={occClass}
                onChange={e => { setOccClass(Number(e.target.value)); setResult(null) }}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#002855]"
              >
                <option value={1}>Class 1 — Professional / Administrative (lowest risk)</option>
                <option value={2}>Class 2 — Skilled / Technical</option>
                <option value={3}>Class 3 — Semi-skilled / Light manual</option>
                <option value={4}>Class 4 — Heavy manual / Hazardous</option>
              </select>
            </div>
          )}

          {/* Plan tier — Life Support (Platinum/Gold/Silver) */}
          {needsTierLS && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Benefit Level <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                {['Platinum','Gold','Silver'].map(t => (
                  <button key={t} type="button" onClick={() => { setPlanTier(t); setResult(null) }}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      planTier === t ? 'bg-[#002855] text-white border-[#002855]'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-[#002855]/40'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Plan tier — Supreme FP (Plan I–IV) */}
          {needsTierSup && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan Level <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                {['I','II','III','IV'].map(t => (
                  <button key={t} type="button" onClick={() => { setPlanTier(t); setResult(null) }}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      planTier === t ? 'bg-[#002855] text-white border-[#002855]'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-[#002855]/40'}`}>
                    Plan {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Coverage type — Cancer Care */}
          {needsCovType && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Coverage Type</label>
              <select
                value={coverageType}
                onChange={e => { setCoverageType(e.target.value); setResult(null) }}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#002855]"
              >
                <option value="Individual">Individual</option>
                <option value="Single_Parent">Single Parent</option>
                <option value="Husband_Wife">Husband &amp; Wife</option>
                <option value="Full_Family">Full Family</option>
              </select>
            </div>
          )}

          {/* Elimination period — A&S DI 68A */}
          {needsEP && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Elimination Period</label>
              <select
                value={epCode}
                onChange={e => { setEpCode(e.target.value); setResult(null) }}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#002855]"
              >
                {EP_OPTIONS.map(ep => (
                  <option key={ep.code} value={ep.code}>{ep.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400">S = Sickness days before benefit starts; A = Accident days</p>
            </div>
          )}

          {/* Coverage / benefit amount */}
          {needsCoverage && paCovMeta && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {paCovMeta.label} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">TTD</span>
                <input
                  type="number"
                  min={paCovMeta.step}
                  step={paCovMeta.step}
                  placeholder={paCovMeta.placeholder}
                  value={coverage}
                  onChange={e => { setCoverage(e.target.value); setResult(null) }}
                  onKeyDown={e => e.key === 'Enter' && canQuote() && handleGetQuote()}
                  className="w-full border border-gray-300 rounded-xl py-3 pl-16 pr-4 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#002855]"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Life / Health inputs ──────────────────────────────── */}
      {isLifeOrHealth && (
        <div className="space-y-4">
          {!isUnisex && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sex at birth</label>
              <div className="flex gap-2">
                {(['F','M'] as const).map(v => (
                  <button key={v} type="button" onClick={() => setSex(v)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      sex === v ? 'bg-[#002855] text-white border-[#002855]'
                               : 'bg-white text-gray-600 border-gray-300 hover:border-[#002855]/40'}`}>
                    {v === 'F' ? 'Female' : 'Male'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isUnisex && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Do you smoke?</label>
              <div className="flex gap-2">
                {([false,true] as const).map(v => (
                  <button key={String(v)} type="button" onClick={() => setSmoker(v)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      smoker === v ? 'bg-[#002855] text-white border-[#002855]'
                                  : 'bg-white text-gray-600 border-gray-300 hover:border-[#002855]/40'}`}>
                    {v ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isESP && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan Duration</label>
              <select
                value={espDuration}
                onChange={e => setEspDuration(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#002855]"
              >
                {ESP_DURATIONS.map(d => <option key={d} value={d}>{d} years</option>)}
              </select>
              <p className="text-xs text-gray-400">Years until the education fund matures</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {isESP ? 'Education Fund Amount' : 'Coverage Amount'} <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">TTD</span>
              <input
                type="number"
                min="0"
                step="50000"
                placeholder={isESP ? 'e.g. 100000' : 'e.g. 500000'}
                value={coverage}
                onChange={e => setCoverage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canQuote() && handleGetQuote()}
                className="w-full border border-gray-300 rounded-xl py-3 pl-16 pr-4 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#002855]"
              />
            </div>
            {isUnisex && (
              <p className="text-xs text-gray-400">Single rate for all — no sex or smoker loading.</p>
            )}
          </div>
        </div>
      )}

      {/* Annuities */}
      {isAnnuity && (
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
          {result.net_rate !== undefined && (
            <p className="text-xs text-gray-400">
              Rate: TTD {result.net_rate.toFixed(2)} per unit · Policy fee: TTD 151.05/yr
            </p>
          )}
          {result.rate_per_unit !== undefined && (
            <p className="text-xs text-gray-400">
              Rate per unit: TTD {result.rate_per_unit.toFixed(2)}
              {result.units ? ` × ${result.units} unit${result.units > 1 ? 's' : ''}` : ''}
            </p>
          )}
          {result.ep_label && (
            <p className="text-xs text-gray-400">Elimination period: {result.ep_label}</p>
          )}
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
      {!result && !isAnnuity && (
        <button
          onClick={handleGetQuote}
          disabled={!canQuote() || loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#002855] text-white rounded-xl font-semibold hover:bg-[#002855]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Calculating…</>
            : <><Calculator size={16} /> Get Quote</>}
        </button>
      )}

      {/* Annuities — go straight to apply */}
      {isAnnuity && (
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
