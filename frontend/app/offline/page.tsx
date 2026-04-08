'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#002855] flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <div className="w-20 h-20 bg-[#C9A84C] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-[#002855] font-bold text-2xl">PAL</span>
        </div>
        <h1 className="text-white text-3xl font-bold">PAL360</h1>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-sm w-full">
        <div className="text-5xl mb-4">📡</div>
        <h2 className="text-white text-xl font-semibold mb-3">You are offline</h2>
        <p className="text-white/70 text-sm leading-relaxed">
          Please check your internet connection. Your cached data is available — reconnect to see the latest updates.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 w-full bg-[#C9A84C] text-[#002855] font-semibold py-3 px-6 rounded-xl hover:bg-[#e0c06a] transition-colors"
        >
          Try Again
        </button>
      </div>

      <p className="text-white/40 text-xs mt-8">Pan American Life Insurance Group</p>
    </div>
  )
}
