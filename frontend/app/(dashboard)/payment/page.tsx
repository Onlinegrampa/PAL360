'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { PaymentForm } from '@/components/PaymentForm'
import { PaymentSkeleton } from '@/components/Skeleton'
import type { Policy } from '@/lib/types'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

export default function PaymentPage() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/policies`)
      .then((r) => r.json())
      .then((data) => {
        setPolicies(data.filter((p: Policy) => p.status === 'IN-FORCE'))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const duePolicies = policies.filter((p) => {
    const due = new Date(p.due_date)
    const today = new Date()
    const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilDue <= 30
  })

  const totalDue = duePolicies.reduce((sum, p) => sum + p.premium, 0)

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-16 animate-[fadeIn_0.4s_ease-out]">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-[#002855] text-2xl font-bold mb-2">Payment Successful</h2>
        <p className="text-gray-500 mb-6">Your premium has been processed. A receipt has been sent to your email.</p>
        <button
          onClick={() => setSuccess(false)}
          className="bg-[#002855] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#003a7a] transition-colors"
        >
          Back to Payments
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto animate-[fadeIn_0.4s_ease-out]">
      <div className="mb-6">
        <h1 className="text-[#002855] text-2xl md:text-3xl font-bold">Pay Premium</h1>
        <p className="text-gray-500 text-sm mt-1">Secure payment via Stripe (Test Mode)</p>
      </div>

      {loading ? (
        <PaymentSkeleton />
      ) : (
        <>
          {/* Due summary */}
          <div className="pal-card p-5 mb-6">
            <h2 className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-3">Due Within 30 Days</h2>
            {duePolicies.length === 0 ? (
              <p className="text-gray-400 text-sm">No payments due in the next 30 days.</p>
            ) : (
              <div className="space-y-3">
                {duePolicies.map((policy) => (
                  <div key={policy.policy_id} className="flex items-center justify-between">
                    <div>
                      <p className="text-[#002855] font-medium text-sm">{policy.line} Policy</p>
                      <p className="text-gray-400 text-xs">{policy.policy_id} · Due {policy.due_date.slice(0, 10)}</p>
                    </div>
                    <p className="text-[#002855] font-bold">${policy.premium.toLocaleString()}</p>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <p className="text-gray-600 font-semibold">Total Due</p>
                  <p className="text-[#C9A84C] font-bold text-xl">${totalDue.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Stripe payment form */}
          {duePolicies.length > 0 && (
            <div className="pal-card p-5">
              <h2 className="text-[#002855] font-semibold mb-4">Card Details</h2>
              <Elements stripe={stripePromise}>
                <PaymentForm amount={totalDue} onSuccess={() => setSuccess(true)} />
              </Elements>
            </div>
          )}
        </>
      )}
    </div>
  )
}
