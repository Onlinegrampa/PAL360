'use client'

import { useState } from 'react'
import { ChevronRight, ChevronLeft, Shield, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserProfile {
  name: string
  age: number
  retirement_age: number
  annual_income_usd: number
  annual_living_costs_usd: number
  income_growth_rate: number
  discount_rate: number
  total_debt_usd: number
  mortgage_balance_usd: number
  mortgage_years_remaining: number
  num_dependants: number
  education_fund_needed_usd: number
  desired_retirement_income_usd: number
  existing_pension_usd: number
  home_currency: string
  usd_fx_rate: number
  inflation_rate_home: number
  smoker: boolean
  pre_existing_conditions: boolean
  estate_value_usd: number
  has_will: boolean
}

interface FortressResult {
  hcv: { gross_hcv_usd: number; maintenance_pv_usd: number; net_hcv_usd: number; years_to_retirement: number }
  cre: { cre_composite: number; premature_death_score: number; morbidity_score: number; longevity_score: number; currency_score: number }
  dimes: { total_dimes_need_usd: number; debt_component: number; income_replacement: number; mortgage_component: number; education_component: number; succession_component: number; sovereignty_hedge: number }
  cat: { annual_income_gap_usd: number; cat_at_retirement_usd: number; lump_sum_needed_today_usd: number; years_in_retirement: number }
  ci: { salary_component_usd: number; treatment_peg_usd: number; total_ci_cover_needed_usd: number }
  action_plan: { step: number; domain: string; score: number; action: string; rationale: string }[]
  traffic_lights: { premature_death: string; morbidity: string; longevity: string; currency: string }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const tlColor: Record<string, string> = {
  RED:    'text-red-600 bg-red-50 border-red-200',
  YELLOW: 'text-amber-600 bg-amber-50 border-amber-200',
  GREEN:  'text-emerald-600 bg-emerald-50 border-emerald-200',
}
const tlDot: Record<string, string> = {
  RED:    'bg-red-500',
  YELLOW: 'bg-amber-400',
  GREEN:  'bg-emerald-500',
}

// ── SVG Radar Chart ───────────────────────────────────────────────────────────

function RadarChart({ scores }: { scores: number[] }) {
  const labels = ['Life Cover', 'CI Cover', 'Retirement', 'Currency', 'HCV Health', 'Succession']
  const cx = 160, cy = 160, r = 120
  const n = labels.length
  const angleStep = (2 * Math.PI) / n
  const startAngle = -Math.PI / 2

  const polar = (i: number, radius: number) => {
    const a = startAngle + i * angleStep
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) }
  }

  const rings = [20, 40, 60, 80, 100]
  const dataPoints = scores.map((s, i) => polar(i, (s / 100) * r))
  const polygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-xs mx-auto">
      {/* Grid rings */}
      {rings.map(ring => {
        const pts = Array.from({ length: n }, (_, i) => {
          const p = polar(i, (ring / 100) * r)
          return `${p.x},${p.y}`
        }).join(' ')
        return <polygon key={ring} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="1" />
      })}
      {/* Axes */}
      {Array.from({ length: n }, (_, i) => {
        const p = polar(i, r)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#d1d5db" strokeWidth="1" />
      })}
      {/* Data polygon */}
      <polygon
        points={polygon}
        fill="rgba(220,38,38,0.15)"
        stroke="rgba(220,38,38,0.7)"
        strokeWidth="2"
      />
      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#dc2626" />
      ))}
      {/* Labels */}
      {labels.map((label, i) => {
        const p = polar(i, r + 22)
        const anchor = p.x < cx - 5 ? 'end' : p.x > cx + 5 ? 'start' : 'middle'
        return (
          <text key={i} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle"
            fontSize="10" fill="#374151" fontWeight="500">
            {label}
          </text>
        )
      })}
    </svg>
  )
}

// ── Score Bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 65 ? 'bg-red-500' : score >= 40 ? 'bg-amber-400' : 'bg-emerald-500'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="text-gray-800 font-bold">{score.toFixed(0)}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

// ── Dimes Bar ─────────────────────────────────────────────────────────────────

function DimesBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs text-gray-600 font-medium text-right shrink-0">{label}</div>
      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
        <div className={`h-full rounded ${color} flex items-center px-2`} style={{ width: `${Math.max(pct, 2)}%` }}>
          <span className="text-white text-[10px] font-bold truncate">{fmt(value)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5
const CURRENCIES = ['TTD', 'GYD', 'JMD', 'BBD', 'USD', 'EUR', 'GBP', 'Other']
const FX_DEFAULTS: Record<string, number> = { TTD: 6.75, GYD: 209, JMD: 156, BBD: 2.0, USD: 1, EUR: 0.92, GBP: 0.79, Other: 1 }

export default function FortressPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FortressResult | null>(null)

  // Form state
  const [f, setF] = useState<Partial<UserProfile>>({
    retirement_age: 65,
    income_growth_rate: 3,
    discount_rate: 8,
    home_currency: 'TTD',
    usd_fx_rate: 6.75,
    inflation_rate_home: 6,
    smoker: false,
    pre_existing_conditions: false,
    has_will: false,
    existing_pension_usd: 0,
    estate_value_usd: 0,
    mortgage_balance_usd: 0,
    mortgage_years_remaining: 0,
    total_debt_usd: 0,
  })

  const set = (k: keyof UserProfile, v: unknown) => setF(p => ({ ...p, [k]: v }))

  const num = (k: keyof UserProfile) => (f[k] as number) ?? 0
  const str = (k: keyof UserProfile) => (f[k] as string) ?? ''
  const bool = (k: keyof UserProfile) => (f[k] as boolean) ?? false

  const field = (label: string, k: keyof UserProfile, opts?: { type?: string; min?: number; max?: number; step?: number; prefix?: string }) => (
    <label className="block">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <div className="relative mt-1">
        {opts?.prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{opts.prefix}</span>
        )}
        <input
          type={opts?.type ?? 'number'}
          min={opts?.min}
          max={opts?.max}
          step={opts?.step ?? 1}
          value={opts?.type === 'text' ? str(k) : (num(k) || '')}
          onChange={e => set(k, opts?.type === 'text' ? e.target.value : parseFloat(e.target.value) || 0)}
          className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#002855]/30 focus:border-[#002855] ${opts?.prefix ? 'pl-7' : ''}`}
        />
      </div>
    </label>
  )

  const slider = (label: string, k: keyof UserProfile, min: number, max: number, suffix = '%') => (
    <label className="block">
      <div className="flex justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <span className="text-xs font-bold text-[#002855]">{num(k)}{suffix}</span>
      </div>
      <input
        type="range" min={min} max={max} step={0.5}
        value={num(k)}
        onChange={e => set(k, parseFloat(e.target.value))}
        className="w-full mt-2 accent-[#002855]"
      />
    </label>
  )

  async function submit() {
    setLoading(true)
    setError(null)
    try {
      const payload: UserProfile = {
        name: str('name'),
        age: num('age'),
        retirement_age: num('retirement_age'),
        annual_income_usd: num('annual_income_usd'),
        annual_living_costs_usd: num('annual_living_costs_usd'),
        income_growth_rate: num('income_growth_rate') / 100,
        discount_rate: num('discount_rate') / 100,
        total_debt_usd: num('total_debt_usd'),
        mortgage_balance_usd: num('mortgage_balance_usd'),
        mortgage_years_remaining: num('mortgage_years_remaining'),
        num_dependants: num('num_dependants'),
        education_fund_needed_usd: num('education_fund_needed_usd'),
        desired_retirement_income_usd: num('desired_retirement_income_usd'),
        existing_pension_usd: num('existing_pension_usd'),
        home_currency: str('home_currency'),
        usd_fx_rate: num('usd_fx_rate'),
        inflation_rate_home: num('inflation_rate_home') / 100,
        smoker: bool('smoker'),
        pre_existing_conditions: bool('pre_existing_conditions'),
        estate_value_usd: num('estate_value_usd'),
        has_will: bool('has_will'),
      }
      const data = await apiFetch<FortressResult>('/financial-fortress/calculate', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Calculation failed. Please check your inputs.')
    } finally {
      setLoading(false)
    }
  }

  // ── Results view ─────────────────────────────────────────────────────────
  if (result) {
    const { hcv, cre, dimes, cat, ci, action_plan, traffic_lights } = result
    const cur = str('home_currency') || 'TTD'
    const fx = num('usd_fx_rate') || 6.75

    const fmtLocal = (usd: number) =>
      `${fmt(usd)} · ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(usd * fx)} ${cur}`

    const radarScores = [
      cre.premature_death_score,
      cre.morbidity_score,
      cre.longevity_score,
      cre.currency_score,
      Math.max(0, Math.min(100, 100 - (hcv.net_hcv_usd / Math.max(hcv.gross_hcv_usd, 1)) * 100)),
      bool('has_will') ? 20 : 80,
    ]

    const tlDomains = [
      { label: 'Premature Death', key: 'premature_death', score: cre.premature_death_score },
      { label: 'Morbidity',       key: 'morbidity',       score: cre.morbidity_score },
      { label: 'Longevity',       key: 'longevity',       score: cre.longevity_score },
      { label: 'Currency Risk',   key: 'currency',        score: cre.currency_score },
    ]

    const dimesBars = [
      { label: 'Debt',            value: dimes.debt_component,      color: 'bg-red-500' },
      { label: 'Income (10×)',    value: dimes.income_replacement,  color: 'bg-orange-500' },
      { label: 'Mortgage',        value: dimes.mortgage_component,  color: 'bg-amber-500' },
      { label: 'Education',       value: dimes.education_component, color: 'bg-emerald-500' },
      { label: 'Succession',      value: dimes.succession_component, color: 'bg-blue-500' },
      { label: 'Sovereignty',     value: dimes.sovereignty_hedge,   color: 'bg-violet-500' },
    ]

    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#002855]">Financial Fortress Report</h1>
            <p className="text-sm text-gray-500 mt-0.5">{str('name')} · {str('home_currency')} baseline</p>
          </div>
          <button
            onClick={() => { setResult(null); setStep(1) }}
            className="text-xs text-gray-500 hover:text-[#002855] border border-gray-200 rounded-xl px-4 py-2 transition-colors"
          >
            New Assessment
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Net Human Capital', value: fmt(hcv.net_hcv_usd), sub: hcv.net_hcv_usd >= 0 ? 'Positive' : 'Deficit', warn: hcv.net_hcv_usd < 0 },
            { label: 'CRE Score', value: `${cre.cre_composite}/100`, sub: cre.cre_composite >= 65 ? 'High Risk' : cre.cre_composite >= 40 ? 'Moderate' : 'Low Risk', warn: cre.cre_composite >= 65 },
            { label: 'DIME-S+ Need', value: fmt(dimes.total_dimes_need_usd), sub: `${new Intl.NumberFormat('en-US', { notation: 'compact' }).format(dimes.total_dimes_need_usd * fx)} ${cur}`, warn: false },
            { label: 'CI Cover Need', value: fmt(ci.total_ci_cover_needed_usd), sub: `${new Intl.NumberFormat('en-US', { notation: 'compact' }).format(ci.total_ci_cover_needed_usd * fx)} ${cur}`, warn: false },
          ].map(kpi => (
            <div key={kpi.label} className={`rounded-2xl border p-4 ${kpi.warn ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
              <p className="text-xs text-gray-500 font-medium">{kpi.label}</p>
              <p className={`text-lg font-bold mt-1 ${kpi.warn ? 'text-red-600' : 'text-[#002855]'}`}>{kpi.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Traffic lights */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-[#002855] mb-4 uppercase tracking-wide">Risk Traffic Light</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tlDomains.map(d => {
              const tl = traffic_lights[d.key as keyof typeof traffic_lights]
              return (
                <div key={d.key} className={`rounded-xl border px-3 py-3 ${tlColor[tl]}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${tlDot[tl]}`} />
                    <span className="text-xs font-bold">{tl}</span>
                  </div>
                  <p className="text-xs font-semibold">{d.label}</p>
                  <p className="text-[11px] mt-0.5 opacity-70">{d.score.toFixed(0)}/100</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Radar + Score Bars */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-[#002855] mb-3 uppercase tracking-wide">Risk Radar</h2>
            <RadarChart scores={radarScores} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-[#002855] mb-4 uppercase tracking-wide">Domain Scores</h2>
            <div className="space-y-4">
              <ScoreBar score={cre.premature_death_score} label="Premature Death" />
              <ScoreBar score={cre.morbidity_score}       label="Morbidity" />
              <ScoreBar score={cre.longevity_score}       label="Longevity" />
              <ScoreBar score={cre.currency_score}        label="Currency Risk" />
              <ScoreBar score={radarScores[4]}            label="HCV Health" />
              <ScoreBar score={radarScores[5]}            label="Succession" />
            </div>
          </div>
        </div>

        {/* Action Plan */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-[#002855] mb-4 uppercase tracking-wide">
            Action Plan — Highest Risk First
          </h2>
          {action_plan.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <CheckCircle size={20} className="text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-700">All risk scores are within acceptable ranges. Review annually.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {action_plan.map(item => (
                <details key={item.step} className="group rounded-xl border border-gray-200 overflow-hidden">
                  <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors list-none">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${item.score >= 65 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{item.domain}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.score >= 65 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.score.toFixed(0)}/100
                    </span>
                    <ChevronRight size={14} className="text-gray-400 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                    <p className="text-sm text-gray-700 font-medium mb-1">{item.action}</p>
                    <p className="text-xs text-gray-500">{item.rationale}</p>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>

        {/* DIME-S+ Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-sm font-bold text-[#002855] uppercase tracking-wide">DIME-S+ Coverage Need</h2>
            <div className="text-right">
              <p className="text-lg font-bold text-[#002855]">{fmt(dimes.total_dimes_need_usd)}</p>
              <p className="text-[11px] text-gray-400">{new Intl.NumberFormat('en-US', { notation: 'compact' }).format(dimes.total_dimes_need_usd * fx)} {cur}</p>
            </div>
          </div>
          <div className="space-y-3">
            {dimesBars.map(b => (
              <DimesBar key={b.label} {...b} total={dimes.total_dimes_need_usd} />
            ))}
          </div>
        </div>

        {/* CAT + HCV detail */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-[#002855] mb-3 uppercase tracking-wide">Critical Annuity Threshold</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Annual Income Gap</p>
                <p className="font-bold text-gray-800">{fmtLocal(cat.annual_income_gap_usd)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total CAT at Retirement</p>
                <p className="font-bold text-gray-800">{fmtLocal(cat.cat_at_retirement_usd)}</p>
              </div>
              <div className="bg-[#002855]/5 rounded-xl p-3">
                <p className="text-xs text-gray-500">Lump Sum Needed Today</p>
                <p className="font-bold text-[#002855] text-lg">{fmt(cat.lump_sum_needed_today_usd)}</p>
                <p className="text-[11px] text-gray-400">{new Intl.NumberFormat('en-US', { notation: 'compact' }).format(cat.lump_sum_needed_today_usd * fx)} {cur}</p>
              </div>
              <p className="text-[11px] text-gray-400">{cat.years_in_retirement} yrs in retirement · 4% safe floor · inflation-adjusted</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-[#002855] mb-3 uppercase tracking-wide">Human Capital Value</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Gross HCV (income PV)</p>
                <p className="font-bold text-gray-800">{fmtLocal(hcv.gross_hcv_usd)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Less: Maintenance PV</p>
                <p className="font-bold text-gray-800">− {fmt(hcv.maintenance_pv_usd)}</p>
              </div>
              <div className={`rounded-xl p-3 ${hcv.net_hcv_usd >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <p className="text-xs text-gray-500">Net HCV</p>
                <p className={`font-bold text-lg ${hcv.net_hcv_usd >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {fmtLocal(hcv.net_hcv_usd)}
                </p>
              </div>
              <p className="text-[11px] text-gray-400">{hcv.years_to_retirement} working years · {num('income_growth_rate')}% growth · {num('discount_rate')}% discount rate</p>
            </div>
          </div>
        </div>

        {/* CI detail */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-[#002855] mb-3 uppercase tracking-wide">Critical Illness Cover</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Salary Component (3×)</p>
              <p className="font-bold text-gray-800">{fmt(ci.salary_component_usd)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Treatment Peg</p>
              <p className="font-bold text-gray-800">{fmt(ci.treatment_peg_usd)}</p>
            </div>
            <div className="bg-[#002855]/5 rounded-xl p-3">
              <p className="text-xs text-gray-500">Total CI Need</p>
              <p className="font-bold text-[#002855]">{fmt(ci.total_ci_cover_needed_usd)}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Step wizard ───────────────────────────────────────────────────────────

  const stepTitles = [
    'Identity & Income',
    'Debts & Mortgage',
    'Dependants & Retirement',
    'Currency & Health',
    'Estate & Succession',
  ]

  return (
    <div className="max-w-lg mx-auto pb-10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#002855] rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-[#C9A84C]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#002855]">Financial Fortress</h1>
            <p className="text-xs text-gray-500">Personal risk & coverage needs assessment</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Step {step} of {TOTAL_STEPS} — {stepTitles[step - 1]}</span>
            <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#002855] rounded-full transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">

        {/* Step 1 */}
        {step === 1 && (
          <>
            {field('Full Name', 'name', { type: 'text' })}
            <div className="grid grid-cols-2 gap-4">
              {field('Current Age', 'age', { min: 18, max: 80 })}
              {field('Retirement Age', 'retirement_age', { min: 50, max: 80 })}
            </div>
            {field('Annual Income (USD equivalent)', 'annual_income_usd', { min: 0, step: 1000, prefix: '$' })}
            {field('Annual Living Costs (USD)', 'annual_living_costs_usd', { min: 0, step: 500, prefix: '$' })}
            {slider('Expected Income Growth', 'income_growth_rate', 0, 10)}
            {slider('Personal Discount Rate', 'discount_rate', 4, 15)}
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            {field('Total Non-Mortgage Debt (USD)', 'total_debt_usd', { min: 0, step: 500, prefix: '$' })}
            {field('Mortgage Balance (USD)', 'mortgage_balance_usd', { min: 0, step: 1000, prefix: '$' })}
            {field('Mortgage Years Remaining', 'mortgage_years_remaining', { min: 0, max: 40 })}
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            {field('Number of Dependants', 'num_dependants', { min: 0, max: 10 })}
            {field('Education Fund Needed (USD)', 'education_fund_needed_usd', { min: 0, step: 1000, prefix: '$' })}
            {field('Desired Annual Retirement Income (USD)', 'desired_retirement_income_usd', { min: 0, step: 500, prefix: '$' })}
            {field('Existing Pension / Annuity Income (USD/yr)', 'existing_pension_usd', { min: 0, step: 500, prefix: '$' })}
          </>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <>
            <label className="block">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Home Currency</span>
              <select
                value={str('home_currency')}
                onChange={e => {
                  set('home_currency', e.target.value)
                  set('usd_fx_rate', FX_DEFAULTS[e.target.value] ?? 1)
                }}
                className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#002855]/30"
              >
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            {field(`Exchange Rate (1 USD = X ${str('home_currency')})`, 'usd_fx_rate', { min: 0.01, step: 0.01 })}
            {slider('Local Inflation Rate', 'inflation_rate_home', 1, 20)}
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={bool('smoker')}
                  onChange={e => set('smoker', e.target.checked)}
                  className="w-4 h-4 accent-[#002855]"
                />
                <span className="text-sm text-gray-700 font-medium">Smoker</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={bool('pre_existing_conditions')}
                  onChange={e => set('pre_existing_conditions', e.target.checked)}
                  className="w-4 h-4 accent-[#002855]"
                />
                <span className="text-sm text-gray-700 font-medium">Pre-existing Conditions</span>
              </label>
            </div>
          </>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <>
            {field('Estimated Estate / Net Worth (USD)', 'estate_value_usd', { min: 0, step: 5000, prefix: '$' })}
            <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={bool('has_will')}
                onChange={e => set('has_will', e.target.checked)}
                className="w-4 h-4 accent-[#002855]"
              />
              <div>
                <p className="text-sm text-gray-700 font-medium">I have a valid will</p>
                <p className="text-xs text-gray-400">Reduces your succession risk score</p>
              </div>
            </label>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <div className="bg-[#002855]/5 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-[#002855]" />
                <p className="text-xs font-semibold text-[#002855]">What you'll receive</p>
              </div>
              <ul className="text-xs text-gray-600 space-y-0.5 pl-5 list-disc">
                <li>Human Capital Valuation (HCV)</li>
                <li>Comprehensive Risk Exposure (CRE) score</li>
                <li>DIME-S+ total coverage need</li>
                <li>Critical Annuity Threshold (CAT)</li>
                <li>Prioritised action plan</li>
              </ul>
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <button
            onClick={step < TOTAL_STEPS ? () => setStep(s => s + 1) : submit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#002855] text-white text-sm font-semibold hover:bg-[#002855]/90 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : step < TOTAL_STEPS ? (
              <><span>Continue</span><ChevronRight size={16} /></>
            ) : (
              <><Shield size={16} /><span>Generate Report</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
