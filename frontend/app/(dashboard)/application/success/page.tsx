'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, LayoutDashboard, Package } from 'lucide-react'

function SuccessContent() {
  const params = useSearchParams()
  const ref = params.get('ref') ?? 'APP-UNKNOWN'
  const product = params.get('product') ?? 'your selected policy'

  return (
    <div className="max-w-md mx-auto text-center py-8 animate-[fadeIn_0.4s_ease-out]">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
          <CheckCircle size={44} className="text-green-500" strokeWidth={1.5} />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
      <p className="text-gray-500 mb-8 leading-relaxed">
        Your application for{' '}
        <span className="font-semibold text-[#002855]">{product}</span>{' '}
        has been received and is now under review.
      </p>

      {/* Reference card */}
      <div className="bg-[#002855]/5 border border-[#002855]/10 rounded-2xl p-6 mb-8">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Reference Number</p>
        <p className="text-3xl font-black text-[#002855] font-mono tracking-wide">{ref}</p>
        <p className="text-xs text-gray-400 mt-2">Save this for your records</p>
      </div>

      {/* Next steps */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8 text-left space-y-4">
        <p className="text-sm font-bold text-gray-700">What happens next?</p>
        {[
          'An underwriter reviews your application (2–3 business days)',
          'You\'ll receive an email with next steps or any required documents',
          'Once approved, your policy number is assigned and coverage begins',
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#002855] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {i + 1}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>

      {/* CTA buttons */}
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#002855] text-white rounded-xl font-semibold hover:bg-[#002855]/90 transition-colors text-sm"
        >
          <LayoutDashboard size={16} />
          Dashboard
        </Link>
        <Link
          href="/products"
          className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
        >
          <Package size={16} />
          More Products
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 text-gray-400">
        Loading…
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
