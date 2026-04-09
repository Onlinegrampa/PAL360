'use client'

import { useState } from 'react'
import { ArrowRight, ArrowLeft, Loader2, DollarSign, TrendingDown, Users, Target } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface FactFindResult {
  id: number
  client_id: string
  life_insurance_needed: number
  current_coverage: number
  protection_gap: number
  gap_percentage: number
  status: string
  created_at: string
}

interface Props {
  clientId: string
  onComplete: (result: FactFindResult) => void
}

const steps = [
  { number: 1, title: 'Annual Income',   icon: DollarSign,  field: 'annual_income',   hint: 'Your total yearly earnings before tax' },
  { number: 2, title: 'Annual Expenses', icon: TrendingDown, field: 'annual_expenses', hint: 'Rent, food, utilities, school fees — everything' },
  { number: 3, title: 'Total Debt',      icon: TrendingDown, field: 'total_debt',      hint: 'Mortgage, car loans, credit cards combined' },
  { number: 4, title: 'Dependents',      icon: Users,        field: 'num_dependents',  hint: 'People who rely on your income' },
]

export default function FactFindWizard({ clientId, onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    annual_income:   '',
    annual_expenses: '',
    total_debt:      '',
    num_dependents:  '',
    financial_goals: '',
  })

  const set = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const isStepValid = () => {
    if (step === 1) return formData.annual_income !== '' && Number(formData.annual_income) >= 0
    if (step === 2) return formData.annual_expenses !== '' && Number(formData.annual_expenses) >= 0
    if (step === 3) return formData.total_debt !== '' && Number(formData.total_debt) >= 0
    if (step === 4) return formData.num_dependents !== '' && Number(formData.num_dependents) >= 0
    if (step === 5) return formData.financial_goals.trim().length > 0
    return false
  }

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFetch<FactFindResult>('/fact-finds/calculate', {
        method: 'POST',
        body: JSON.stringify({
          annual_income:   parseFloat(formData.annual_income),
          annual_expenses: parseFloat(formData.annual_expenses),
          total_debt:      parseFloat(formData.total_debt),
          num_dependents:  parseInt(formData.num_dependents),
          financial_goals: formData.financial_goals,
        }),
      })
      onComplete(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const progressPct = ((step - 1) / 4) * 100

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-[#002855]">Step {step} of 5</span>
          <span className="text-sm text-gray-400">{Math.round(progressPct)}% complete</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C9A84C] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {/* Step dots */}
        <div className="flex justify-between mt-2">
          {[1, 2, 3, 4, 5].map(s => (
            <div
              key={s}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                s < step
                  ? 'bg-[#C9A84C] text-[#002855]'
                  : s === step
                  ? 'bg-[#002855] text-white ring-2 ring-[#002855] ring-offset-2'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
          ))}
        </div>
      </div>

      {/* Step content card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">

        {/* Steps 1–4: money / dependents inputs */}
        {step <= 4 && (() => {
          const s = steps[step - 1]
          const isMoneyField = step <= 3
          return (
            <div className="space-y-5">
              <div className="w-12 h-12 bg-[#002855]/10 rounded-xl flex items-center justify-center">
                <s.icon size={22} className="text-[#002855]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{s.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{s.hint}</p>
              </div>
              <div className="relative">
                {isMoneyField && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    TTD
                  </span>
                )}
                <input
                  type="number"
                  min="0"
                  placeholder={isMoneyField ? '0.00' : '0'}
                  className={`w-full border border-gray-300 rounded-xl py-3 pr-4 text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#002855] ${
                    isMoneyField ? 'pl-16' : 'pl-4'
                  }`}
                  value={formData[s.field as keyof typeof formData]}
                  onChange={e => set(s.field, e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && isStepValid() && setStep(step + 1)}
                  autoFocus
                />
              </div>
            </div>
          )
        })()}

        {/* Step 5: Goals */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="w-12 h-12 bg-[#002855]/10 rounded-xl flex items-center justify-center">
              <Target size={22} className="text-[#002855]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Financial Goals</h2>
              <p className="text-sm text-gray-500 mt-1">
                What matters most to you? (children's education, retirement, mortgage, etc.)
              </p>
            </div>
            <textarea
              rows={4}
              placeholder="e.g. Pay off mortgage by 2035, fund my children's university, retire at 60"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#002855] resize-none"
              value={formData.financial_goals}
              onChange={e => set('financial_goals', e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-5">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {step < 5 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!isStepValid()}
            className="flex items-center gap-2 ml-auto px-6 py-3 bg-[#002855] text-white rounded-xl font-semibold hover:bg-[#002855]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleCalculate}
            disabled={!isStepValid() || loading}
            className="flex items-center gap-2 ml-auto px-6 py-3 bg-[#C9A84C] text-[#002855] rounded-xl font-bold hover:bg-[#C9A84C]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Calculating…
              </>
            ) : (
              <>
                Calculate My Gap
                <ArrowRight size={16} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
