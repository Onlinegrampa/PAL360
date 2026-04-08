export function PolicySkeleton() {
  return (
    <div className="pal-card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 skeleton rounded-xl" />
          <div className="space-y-2">
            <div className="h-4 skeleton w-32 rounded" />
            <div className="h-3 skeleton w-24 rounded" />
          </div>
        </div>
        <div className="h-6 skeleton w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 skeleton w-16 rounded" />
            <div className="h-4 skeleton w-20 rounded" />
          </div>
        ))}
      </div>
      <div className="h-10 skeleton rounded-xl" />
    </div>
  )
}

export function ClaimSkeleton() {
  return (
    <div className="pal-card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-4 skeleton w-48 rounded" />
          <div className="h-3 skeleton w-32 rounded" />
        </div>
        <div className="h-6 skeleton w-16 rounded-full" />
      </div>
      <div className="h-2 skeleton w-full rounded-full mb-4" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 skeleton w-24 rounded" />
            <div className="h-3 skeleton w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProductSkeleton() {
  return (
    <div className="pal-card p-5 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 skeleton rounded" />
        <div className="flex-1 space-y-2">
          <div className="h-4 skeleton w-36 rounded" />
          <div className="h-3 skeleton w-20 rounded" />
        </div>
      </div>
      <div className="h-3 skeleton w-full rounded mb-2" />
      <div className="h-3 skeleton w-3/4 rounded mb-4" />
      <div className="space-y-1.5 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-3 skeleton w-full rounded" />
        ))}
      </div>
      <div className="h-10 skeleton rounded-xl" />
    </div>
  )
}

export function PaymentSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="pal-card p-5">
        <div className="h-3 skeleton w-32 rounded mb-4" />
        {[1, 2].map((i) => (
          <div key={i} className="flex justify-between mb-3">
            <div className="space-y-1">
              <div className="h-3 skeleton w-28 rounded" />
              <div className="h-2 skeleton w-20 rounded" />
            </div>
            <div className="h-4 skeleton w-16 rounded" />
          </div>
        ))}
        <div className="border-t pt-3 flex justify-between">
          <div className="h-4 skeleton w-20 rounded" />
          <div className="h-5 skeleton w-24 rounded" />
        </div>
      </div>
      <div className="pal-card p-5">
        <div className="h-4 skeleton w-24 rounded mb-4" />
        <div className="h-14 skeleton rounded-xl mb-4" />
        <div className="h-12 skeleton rounded-xl" />
      </div>
    </div>
  )
}
