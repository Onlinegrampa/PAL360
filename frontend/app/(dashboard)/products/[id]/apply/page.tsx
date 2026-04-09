'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import DigitalApplicationForm from '@/components/DigitalApplicationForm'
import type { Product } from '@/lib/types'

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch<Product>(`/products/${id}`)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-[#002855]" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <p className="text-gray-500 mb-4">Product not found.</p>
        <Link
          href="/products"
          className="text-[#002855] font-semibold hover:underline"
        >
          ← Back to Products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#002855] transition-colors mb-4"
        >
          <ArrowLeft size={15} /> Back to Products
        </Link>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#002855] rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-[#C9A84C] font-bold text-xs">PAL</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#002855]">{product.name}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {product.line} · {product.cost_range}
            </p>
          </div>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed mt-4">{product.use_case}</p>
      </div>

      <DigitalApplicationForm productId={product.product_id} productName={product.name} />
    </div>
  )
}
