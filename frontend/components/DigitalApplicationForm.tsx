'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Loader2, User, Heart, Users, PenLine } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import SignaturePad from '@/components/SignaturePad'

interface Props {
  productId: string
  productName: string
  // Optional quoted premium data passed from the apply page
  premiumMonthly?: string | null
  premiumAnnual?: string | null
  coverage?: string | null
  quotedSex?: 'F' | 'M' | null
}

interface FormData {
  full_name: string
  date_of_birth: string
  address: string
  phone: string
  occupation: string
  sex: 'F' | 'M'
  smoker: boolean
  pre_existing_conditions: string
  beneficiary_name: string
  beneficiary_relationship: string
  beneficiary_phone: string
}

const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#002855] transition-shadow'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

const TOTAL_STEPS = 4

export default function DigitalApplicationForm({
  productId,
  productName,
  premiumMonthly = null,
  premiumAnnual  = null,
  coverage       = null,
  quotedSex      = null,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signature, setSignature] = useState('')

  const [form, setForm] = useState<FormData>({
    full_name: '',
    date_of_birth: '',
    address: '',
    phone: '',
    occupation: '',
    sex: quotedSex ?? 'F',
    smoker: false,
    pre_existing_conditions: '',
    beneficiary_name: '',
    beneficiary_relationship: '',
    beneficiary_phone: '',
  })

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const step1Valid = !!(form.full_name && form.date_of_birth && form.address && form.phone && form.occupation)
  const step3Valid = !!(form.beneficiary_name && form.beneficiary_relationship && form.beneficiary_phone)
  const step4Valid = signature !== ''

  const canProceed = step === 1 ? step1Valid
                   : step === 2 ? true
                   : step === 3 ? step3Valid
                   : step4Valid

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFetch<{ app_ref: string }>('/applications', {
        method: 'POST',
        body: JSON.stringify({
          product_id: productId,
          product_name: productName,
          ...form,
          signature,
        }),
      })

      // Build payment redirect — if there's a quoted premium, go to pay first premium
      const appRef = result.app_ref
      if (premiumMonthly) {
        const p = new URLSearchParams({
          type: 'first_premium',
          premium_monthly: premiumMonthly,
          ...(premiumAnnual ? { premium_annual: premiumAnnual } : {}),
          ...(coverage      ? { coverage }                      : {}),
          product: productName,
          app_ref: appRef,
        })
        router.push(`/payment?${p.toString()}`)
      } else {
        router.push(`/application/success?ref=${appRef}&product=${encodeURIComponent(productName)}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
      setLoading(false)
    }
  }

  const STEPS = [
    { n: 1, label: 'Personal',    icon: User },
    { n: 2, label: 'Health',      icon: Heart },
    { n: 3, label: 'Beneficiary', icon: Users },
    { n: 4, label: 'Sign',        icon: PenLine },
  ]

  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Quoted rate banner */}
      {premiumMonthly && (
        <div className="mb-5 p-4 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-2xl">
          <p className="text-xs font-bold text-[#002855] uppercase tracking-wide mb-1">Your quoted rate</p>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-black text-[#002855]">
              TTD {parseFloat(premiumMonthly).toLocaleString('en-TT', { minimumFractionDigits: 2 })}/mo
            </span>
            {premiumAnnual && (
              <span className="text-sm text-gray-500">
                (TTD {parseFloat(premiumAnnual).toLocaleString('en-TT', { minimumFractionDigits: 2 })}/yr)
              </span>
            )}
          </div>
          {coverage && (
            <p className="text-xs text-gray-500 mt-1">
              Coverage: TTD {parseFloat(coverage).toLocaleString('en-TT')}
            </p>
          )}
        </div>
      )}

      {/* Progress */}
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
        <div className="flex justify-around mt-3">
          {STEPS.map(({ n, label, icon: Icon }) => (
            <div key={n} className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all text-sm font-bold ${
                n < step  ? 'bg-[#C9A84C] text-[#002855]' :
                n === step ? 'bg-[#002855] text-white ring-2 ring-[#002855] ring-offset-2' :
                             'bg-gray-200 text-gray-400'
              }`}>
                {n < step ? '✓' : <Icon size={15} />}
              </div>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 space-y-5">

        {/* Step 1 — Personal */}
        {step === 1 && (
          <>
            <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
            <Field label="Full Name" required>
              <input
                type="text"
                value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                placeholder="As it appears on your ID"
                className={inputCls}
              />
            </Field>
            <Field label="Date of Birth" required>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={e => set('date_of_birth', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Sex at Birth" required>
              <div className="flex gap-2">
                {(['F', 'M'] as const).map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => set('sex', v)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      form.sex === v
                        ? 'bg-[#002855] text-white border-[#002855]'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-[#002855]/40'
                    }`}
                  >
                    {v === 'F' ? 'Female' : 'Male'}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Home Address" required>
              <input
                type="text"
                value={form.address}
                onChange={e => set('address', e.target.value)}
                placeholder="Street, City, Country"
                className={inputCls}
              />
            </Field>
            <Field label="Phone Number" required>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+1 868 xxx-xxxx"
                className={inputCls}
              />
            </Field>
            <Field label="Occupation" required>
              <input
                type="text"
                value={form.occupation}
                onChange={e => set('occupation', e.target.value)}
                placeholder="e.g. Teacher, Engineer, Self-employed"
                className={inputCls}
              />
            </Field>
          </>
        )}

        {/* Step 2 — Health */}
        {step === 2 && (
          <>
            <h2 className="text-lg font-bold text-gray-900">Health Questions</h2>
            <Field label="Do you currently smoke or use tobacco products?">
              <div className="flex gap-3">
                {([true, false] as const).map(val => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => set('smoker', val)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
                      form.smoker === val
                        ? 'bg-[#002855] text-white border-[#002855]'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-[#002855]/40'
                    }`}
                  >
                    {val ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Pre-existing conditions (if any)">
              <textarea
                rows={4}
                value={form.pre_existing_conditions}
                onChange={e => set('pre_existing_conditions', e.target.value)}
                placeholder="e.g. Type 2 diabetes, hypertension — or leave blank if none"
                className={`${inputCls} resize-none`}
              />
            </Field>
            <p className="text-xs text-gray-400 leading-relaxed">
              All information is confidential and used solely for underwriting purposes.
              Accurate disclosure ensures your coverage remains valid.
            </p>
          </>
        )}

        {/* Step 3 — Beneficiary */}
        {step === 3 && (
          <>
            <h2 className="text-lg font-bold text-gray-900">Beneficiary Details</h2>
            <p className="text-sm text-gray-500">Who should receive the benefit if a claim is made?</p>
            <Field label="Full Name" required>
              <input
                type="text"
                value={form.beneficiary_name}
                onChange={e => set('beneficiary_name', e.target.value)}
                placeholder="Beneficiary's full name"
                className={inputCls}
              />
            </Field>
            <Field label="Relationship to You" required>
              <select
                value={form.beneficiary_relationship}
                onChange={e => set('beneficiary_relationship', e.target.value)}
                className={inputCls}
              >
                <option value="">Select relationship…</option>
                {['Spouse', 'Child', 'Parent', 'Sibling', 'Other'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Phone Number" required>
              <input
                type="tel"
                value={form.beneficiary_phone}
                onChange={e => set('beneficiary_phone', e.target.value)}
                placeholder="+1 868 xxx-xxxx"
                className={inputCls}
              />
            </Field>
          </>
        )}

        {/* Step 4 — Signature */}
        {step === 4 && (
          <>
            <h2 className="text-lg font-bold text-gray-900">Electronic Signature</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              By signing below you confirm that all information provided is accurate and you agree to
              the terms and conditions of this application.
            </p>
            <SignaturePad onSave={setSignature} savedDataUrl={signature || undefined} />
            {!step4Valid && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                Please draw and accept your signature to proceed.
              </p>
            )}
          </>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex gap-3 mt-5">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {step < TOTAL_STEPS ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed}
            className="ml-auto flex items-center gap-2 px-6 py-3 bg-[#002855] text-white rounded-xl font-semibold hover:bg-[#002855]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed || loading}
            className="ml-auto flex items-center gap-2 px-6 py-3 bg-[#C9A84C] text-[#002855] rounded-xl font-bold hover:bg-[#C9A84C]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Submitting…</>
            ) : (
              <>Submit Application <ArrowRight size={16} /></>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
