'use client'

import { useState } from 'react'
import { ArrowRight, ArrowLeft, Loader2, DollarSign, TrendingDown, Users, Target, User } from 'lucide-react'
import { apiFetch } from '@/lib/api'

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

interface Props {
  clientId: string
  onComplete: (result: FactFindResult) => void
}

// Steps 2-5 are the money/dependents fields (step 1 is age, step 6 is goals)
const moneySteps = [
  { number: 2, title: 'Annual Income',   icon: DollarSign,  field: 'annual_income',   hint: 'Your total yearly earnings before tax' },
  { number: 3, title: 'Annual Expenses', icon: TrendingDown, field: 'annual_expenses', hint: 'Rent, food, utilities, school fees — everything' },
  { number: 4, title: 'Total Debt',      icon: TrendingDown, field: 'total_debt',      hint: 'Mortgage, car loans, credit cards combined' },
  { number: 5, title: 'Dependents',      icon: Users,        field: 'num_dependents',  hint: 'People who rely on your income' },
]

const TOTAL_STEPS = 6

export default function FactFindWizard({ clientId, onComplete }: Props) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    age:             '',
    annual_income:   '',
    annual_expenses: '',
    total_debt:      '',
    num_dependents:  '',
    financial_goals: '',
  })

  const set = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const isStepValid = () => {
    if (step === 1) {
      const age = Number(formData.age)
      return formData.age !== '' && Number.isInteger(age) && age >= 18 && age <= 100
    }
    if (step === 2) return formData.annual_income   !== '' && Number(formData.annual_income)   >= 0
    if (step === 3) return formData.annual_expenses !== '' && Number(formData.annual_expenses) >= 0
    if (step === 4) return formData.total_debt      !== '' && Number(formData.total_debt)      >= 0
    if (step === 5) return formData.num_dependents  !== '' && Number(formData.num_dependents)  >= 0
    if (step === 6) return formData.financial_goals.trim().length > 0
    return false
  }

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFetch<FactFindResult>('/fact-finds/calculate', {
        method: 'POST',
        body: JSON.stringify({
          age:             parseInt(formData.age),
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

  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  // Which money-step config are we on (steps 2–5)?
  const moneyStep = step >= 2 && step <= 5 ? moneySteps[step - 2] : null
  const isMoneyField = moneyStep && step <= 4  // steps 2–4 are currency

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-[#002855]">Step {step} of {TOTAL_STEPS}</span>
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
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
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

        {/* Step 1: Age */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="w-12 h-12 bg-[#002855]/10 rounded-xl flex items-center justify-center">
              <User size={22} className="text-[#002855]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your Age</h2>
              <p className="text-sm text-gray-500 mt-1">
                Age determines how many years of income your family would need to replace
              </p>
            </div>
            <input
              type="number"
              min="18"
              max="100"
              placeholder="e.g. 35"
              className="w-full border border-gray-300 rounded-xl py-3 px-4 text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#002855]"
              value={formData.age}
              onChange={e => set('age', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && isStepValid() && setStep(2)}
              autoFocus
            />
            {formData.age !== '' && (Number(formData.age) < 18 || Number(formData.age) > 100) && (
              <p className="text-sm text-red-500">Please enter an age between 18 and 100.</p>
            )}
          </div>
        )}

        {/* Steps 2–5: money / dependents */}
        {moneyStep && (
          <div className="space-y-5">
            <div className="w-12 h-12 bg-[#002855]/10 rounded-xl flex items-center justify-center">
              <moneyStep.icon size={22} className="text-[#002855]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{moneyStep.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{moneyStep.hint}</p>
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
                value={formData[moneyStep.field as keyof typeof formData]}
                onChange={e => set(moneyStep.field, e.target.value)}
                onKeyDown={e => e.key === 'Enter' && isStepValid() && setStep(step + 1)}
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 6: Goals */}
        {step === 6 && (
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

        {step < TOTAL_STEPS ? (
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
