'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'

interface PaymentFormProps {
  amount: number
  policyId: string
  onSuccess: (transactionId: string) => void
}

function formatCardNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

export function PaymentForm({ amount, policyId, onSuccess }: PaymentFormProps) {
  const [cardholderName, setCardholderName] = useState('')
  const [cardNumber, setCardNumber]         = useState('')
  const [expiry, setExpiry]                 = useState('')
  const [cvv, setCvv]                       = useState('')
  const [processing, setProcessing]         = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!cardholderName.trim()) { setError('Please enter the cardholder name.'); return }
    if (cardNumber.replace(/\s/g, '').length < 16) { setError('Please enter a valid 16-digit card number.'); return }
    if (expiry.length < 5) { setError('Please enter a valid expiry date (MM/YY).'); return }
    if (cvv.length < 3) { setError('Please enter a valid CVV.'); return }

    setProcessing(true)

    try {
      const data = await apiFetch<{ transaction_id: string }>('/payment', {
        method: 'POST',
        body: JSON.stringify({
          policy_id: policyId,
          amount,
          cardholder_name: cardholderName,
          card_number: cardNumber.replace(/\s/g, ''),
          expiry,
          cvv,
        }),
      })
      onSuccess(data.transaction_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Cardholder name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Cardholder Name</label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          placeholder="Marcus Williams"
          autoComplete="cc-name"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002855]/30 focus:border-[#002855] transition-colors"
        />
      </div>

      {/* Card number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Card Number</label>
        <input
          type="text"
          inputMode="numeric"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          placeholder="4242 4242 4242 4242"
          autoComplete="cc-number"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#002855]/30 focus:border-[#002855] transition-colors"
        />
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry</label>
          <input
            type="text"
            inputMode="numeric"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM/YY"
            autoComplete="cc-exp"
            maxLength={5}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#002855]/30 focus:border-[#002855] transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">CVV</label>
          <input
            type="text"
            inputMode="numeric"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            autoComplete="cc-csc"
            maxLength={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#002855]/30 focus:border-[#002855] transition-colors"
          />
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Demo hint */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
        <strong>Demo Mode:</strong> Enter any name, any 16-digit number, any future date, any CVV.
      </div>

      {/* WiPay branding */}
      <div className="flex items-center gap-2 text-gray-400 text-xs justify-center pt-1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
        Secured by WiPay Financial · Caribbean Payment Gateway
      </div>

      <button
        type="submit"
        disabled={processing}
        className="w-full bg-[#C9A84C] text-[#002855] font-bold py-4 rounded-xl text-base hover:bg-[#e0c06a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {processing ? 'Processing…' : `Pay $${amount.toLocaleString()}`}
      </button>
    </form>
  )
}
