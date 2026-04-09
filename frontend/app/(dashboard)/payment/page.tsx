'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PaymentForm } from '@/components/PaymentForm'
import { PaymentSkeleton } from '@/components/Skeleton'
import { apiFetch } from '@/lib/api'
import type { Policy } from '@/lib/types'
import { Loader2, Shield } from 'lucide-react'

function PaymentPageInner() {
  const searchParams = useSearchParams()

  // First-premium params (from application flow)
  const type           = searchParams.get('type')            // 'first_premium'
  const premiumMonthly = searchParams.get('premium_monthly')
  const premiumAnnual  = searchParams.get('premium_annual')
  const productName    = searchParams.get('product')
  const appRef         = searchParams.get('app_ref')
  const isFirstPremium = type === 'first_premium' && !!premiumMonthly

  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [txnId, setTxnId] = useState('')

  useEffect(() => {
    apiFetch<Policy[]>('/policies')
      .then((data) => setPolicies(data.filter((p: Policy) => p.status === 'IN-FORCE')))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const duePolicies = policies.filter((p) => {
    const days = Math.ceil((new Date(p.due_date).getTime() - Date.now()) / 86_400_000)
    return days <= 30
  })
  const totalDue       = duePolicies.reduce((s, p) => s + p.premium, 0)
  const primaryPolicy  = duePolicies[0]

  const firstPremiumAmount = isFirstPremium ? parseFloat(premiumMonthly!) : 0

  const fmt = (n: number) =>
    `TTD ${n.toLocaleString('en-TT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>
        <h2 className="text-[#002855] text-2xl font-bold mb-2">Payment Successful</h2>
        <p className="text-gray-500 mb-2">
          Your payment of{' '}
          <strong>{fmt(isFirstPremium ? firstPremiumAmount : totalDue)}</strong>{' '}
          has been processed.
        </p>
        {appRef && (
          <p className="text-gray-400 text-sm mb-1">Application: {appRef}</p>
        )}
        <p className="text-gray-400 text-sm mb-6">Transaction ID: {txnId}</p>
        <p className="text-gray-400 text-sm mb-8">A receipt has been sent to your email.</p>
        <a
          href="/dashboard"
          className="inline-block bg-[#002855] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#003a7a] transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[#002855] text-2xl md:text-3xl font-bold">
          {isFirstPremium ? 'First Premium Payment' : 'Pay Premium'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Secure payment powered by WiPay Financial</p>
      </div>

      {loading ? (
        <PaymentSkeleton />
      ) : (
        <div className="space-y-5">
          {/* First premium section */}
          {isFirstPremium && (
            <div className="bg-[#002855] rounded-2xl p-5 text-white">
              <div className="flex items-start gap-3">
                <Shield size={22} className="text-[#C9A84C] mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#C9A84C] mb-1">
                    New Policy — First Premium
                  </p>
                  {productName && (
                    <p className="font-bold text-lg leading-tight mb-0.5">{productName}</p>
                  )}
                  {appRef && (
                    <p className="text-xs text-white/60">Ref: {appRef}</p>
                  )}
                  <div className="flex items-baseline gap-3 mt-3">
                    <span className="text-3xl font-black text-[#C9A84C]">
                      {fmt(firstPremiumAmount)}
                    </span>
                    <span className="text-sm text-white/60">per month</span>
                  </div>
                  {premiumAnnual && (
                    <p className="text-xs text-white/50 mt-0.5">
                      {fmt(parseFloat(premiumAnnual))} annually
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Renewal premiums section */}
          {!isFirstPremium && (
            <div className="pal-card p-5">
              <h2 className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-3">
                Due Within 30 Days
              </h2>
              {duePolicies.length === 0 ? (
                <p className="text-gray-400 text-sm">No payments due in the next 30 days.</p>
              ) : (
                <div className="space-y-3">
                  {duePolicies.map((policy) => (
                    <div key={policy.policy_id} className="flex items-center justify-between">
                      <div>
                        <p className="text-[#002855] font-medium text-sm">{policy.line} Policy</p>
                        <p className="text-gray-400 text-xs">
                          {policy.policy_id} · Due {policy.due_date.slice(0, 10)}
                        </p>
                      </div>
                      <p className="text-[#002855] font-bold">
                        TTD {policy.premium.toLocaleString()}
                      </p>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <p className="text-gray-600 font-semibold">Total Due</p>
                    <p className="text-[#C9A84C] font-bold text-xl">{fmt(totalDue)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment form */}
          {(isFirstPremium || (duePolicies.length > 0 && primaryPolicy)) && (
            <div className="pal-card p-5">
              <h2 className="text-[#002855] font-semibold mb-4">Card Details</h2>
              <PaymentForm
                amount={isFirstPremium ? firstPremiumAmount : totalDue}
                policyId={isFirstPremium ? (appRef ?? 'NEW') : primaryPolicy!.policy_id}
                onSuccess={(id) => { setTxnId(id); setSuccess(true) }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-[#002855]" />
      </div>
    }>
      <PaymentPageInner />
    </Suspense>
  )
}
