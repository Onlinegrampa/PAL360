'use client'

import { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { formatCurrency } from '@/lib/utils'

interface PaymentFormProps {
  amount: number
  onSuccess: () => void
}

export function PaymentForm({ amount, onSuccess }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    // In test mode, simulate successful payment
    const card = elements.getElement(CardElement)
    if (!card) { setProcessing(false); return }

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card,
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed')
      setProcessing(false)
      return
    }

    // Submit to backend
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method_id: paymentMethod?.id,
          amount_cents: Math.round(amount * 100),
        }),
      })

      if (!res.ok) throw new Error('Payment processing failed')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#002855',
                '::placeholder': { color: '#9ca3af' },
              },
            },
          }}
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
        <strong>Test Mode:</strong> Use card 4242 4242 4242 4242, any future date, any CVC
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-[#C9A84C] text-[#002855] font-bold py-4 rounded-xl text-base hover:bg-[#e0c06a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {processing ? 'Processing...' : `Pay ${formatCurrency(amount)}`}
      </button>
    </form>
  )
}
