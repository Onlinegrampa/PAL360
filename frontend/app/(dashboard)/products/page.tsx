'use client'

import { useEffect, useState } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { ProductSkeleton } from '@/components/Skeleton'
import type { Product } from '@/lib/types'

const LINES = ['All', 'Life', 'Health', 'Annuities', 'PA&S']

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'All' ? products : products.filter((p) => p.line === filter)

  return (
    <div className="max-w-4xl mx-auto animate-[fadeIn_0.4s_ease-out]">
      <div className="mb-6">
        <h1 className="text-[#002855] text-2xl md:text-3xl font-bold">Products Catalog</h1>
        <p className="text-gray-500 text-sm mt-1">Explore Pan American Life&apos;s insurance solutions</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {LINES.map((line) => (
          <button
            key={line}
            onClick={() => setFilter(line)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
              filter === line
                ? 'bg-[#002855] text-white border-[#002855]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#002855]/40'
            }`}
          >
            {line}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <ProductSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
