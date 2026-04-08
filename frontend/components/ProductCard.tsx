'use client'

import Link from 'next/link'
import type { Product } from '@/lib/types'

const LINE_COLORS: Record<string, string> = {
  Life: 'bg-blue-50 border-blue-100',
  Health: 'bg-rose-50 border-rose-100',
  Annuities: 'bg-green-50 border-green-100',
  'PA&S': 'bg-purple-50 border-purple-100',
}

const LINE_ICONS: Record<string, string> = {
  Life: '🛡️',
  Health: '❤️‍🩹',
  Annuities: '📈',
  'PA&S': '🏠',
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className={`pal-card p-5 border hover:shadow-md transition-shadow ${LINE_COLORS[product.line] ?? ''}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="text-2xl">{LINE_ICONS[product.line] ?? '📋'}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-[#002855] font-semibold">{product.name}</h3>
            <span className="text-xs font-medium text-gray-500 bg-white/70 px-2 py-0.5 rounded-full border">
              {product.line}
            </span>
          </div>
          <p className="text-[#C9A84C] text-sm font-semibold mt-0.5">{product.cost_range}</p>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 leading-relaxed">{product.use_case}</p>

      <ul className="space-y-1.5 mb-4">
        {product.benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2 text-xs text-gray-600">
            <span className="text-[#002855] mt-0.5 flex-shrink-0">✓</span>
            {benefit}
          </li>
        ))}
      </ul>

      <Link
        href="/payment"
        className="block w-full bg-[#002855] text-white text-sm font-medium py-2.5 px-4 rounded-xl text-center hover:bg-[#003a7a] transition-colors"
      >
        Learn More / Enroll
      </Link>
    </div>
  )
}
