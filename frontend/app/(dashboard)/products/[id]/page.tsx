'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, CheckCircle, FileText } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import QuoteWidget from '@/components/QuoteWidget'
import type { Product } from '@/lib/types'

const LINE_COLORS: Record<string, { bg: string; badge: string; icon: string }> = {
  Life:      { bg: 'bg-blue-50 border-blue-100',    badge: 'bg-blue-100 text-blue-700',    icon: '🛡️' },
  Health:    { bg: 'bg-rose-50 border-rose-100',    badge: 'bg-rose-100 text-rose-700',    icon: '❤️‍🩹' },
  Annuities: { bg: 'bg-green-50 border-green-100',  badge: 'bg-green-100 text-green-700',  icon: '📈' },
  'PA&S':    { bg: 'bg-purple-50 border-purple-100',badge: 'bg-purple-100 text-purple-700',icon: '🏠' },
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    apiFetch<Product>(`/products/${id}`)
      .then(setProduct)
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-[#002855]" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-500">{error ?? 'Product not found.'}</p>
        <button
          onClick={() => router.push('/products')}
          className="mt-4 text-sm text-[#002855] underline"
        >
          Back to Products
        </button>
      </div>
    )
  }

  const theme = LINE_COLORS[product.line] ?? LINE_COLORS.Life

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#002855] transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Products
      </button>

      {/* Hero card */}
      <div className={`rounded-2xl border p-6 md:p-8 ${theme.bg}`}>
        <div className="flex items-start gap-4">
          <div className="text-4xl">{theme.icon}</div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${theme.badge}`}>
                {product.line}
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#002855] leading-tight">{product.name}</h1>
            <p className="text-[#C9A84C] font-semibold mt-1">{product.cost_range}</p>
          </div>
        </div>
        <p className="text-gray-700 mt-4 leading-relaxed">{product.use_case}</p>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Benefits */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#002855]/8 rounded-lg flex items-center justify-center">
              <CheckCircle size={15} className="text-[#002855]" />
            </div>
            <h2 className="font-bold text-gray-900 text-sm">Key Benefits</h2>
          </div>
          <ul className="space-y-3">
            {product.benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#002855]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-[#002855]">{i + 1}</span>
                </div>
                <p className="text-sm text-gray-600 leading-snug">{benefit}</p>
              </li>
            ))}
          </ul>

          {/* Direct apply (no quote) */}
          <button
            onClick={() => router.push(`/products/${product.product_id}/apply`)}
            className="w-full flex items-center justify-center gap-2 py-3 border border-[#002855] text-[#002855] rounded-xl font-semibold text-sm hover:bg-[#002855]/5 transition-all mt-2"
          >
            <FileText size={15} />
            Apply without a quote
          </button>
        </div>

        {/* Quote widget */}
        <QuoteWidget productId={product.product_id} productLine={product.line} />
      </div>
    </div>
  )
}
