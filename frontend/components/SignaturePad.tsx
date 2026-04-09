'use client'

import { useRef, useState, useCallback } from 'react'
import { Pen, Trash2, Check } from 'lucide-react'

interface Props {
  onSave: (dataUrl: string) => void
  savedDataUrl?: string
}

export default function SignaturePad({ onSave, savedDataUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasStrokes, setHasStrokes] = useState(false)
  const [saved, setSaved] = useState(!!savedDataUrl)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  function getPos(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    setIsDrawing(true)
    setSaved(false)
    lastPos.current = getPos(e.nativeEvent as MouseEvent | TouchEvent, canvas)
  }, [])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !lastPos.current) return
    e.preventDefault()

    const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#002855'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
    setHasStrokes(true)
  }, [isDrawing])

  const endDraw = useCallback(() => {
    setIsDrawing(false)
    lastPos.current = null
  }, [])

  const handleClear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStrokes(false)
    setSaved(false)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    onSave(canvas.toDataURL('image/png'))
    setSaved(true)
  }

  return (
    <div className="space-y-3">
      <div
        className={`relative border-2 rounded-xl overflow-hidden transition-colors ${
          saved
            ? 'border-emerald-400 bg-emerald-50'
            : 'border-dashed border-gray-300 bg-gray-50 hover:border-[#002855]/40'
        }`}
      >
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          className="w-full cursor-crosshair touch-none"
          style={{ height: '170px', display: 'block' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {/* Placeholder text */}
        {!hasStrokes && !saved && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2">
            <Pen size={22} className="text-gray-300" />
            <p className="text-sm text-gray-300 font-medium">Sign here</p>
          </div>
        )}
        {/* Baseline */}
        <div className="absolute bottom-8 left-6 right-6 border-b border-gray-300 pointer-events-none" />
        <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-gray-300 pointer-events-none select-none">
          Policyholder signature
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          disabled={!hasStrokes && !saved}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Trash2 size={14} />
          Clear
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasStrokes || saved}
          className={`ml-auto flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
            saved
              ? 'bg-emerald-500 text-white cursor-default'
              : 'bg-[#002855] text-white hover:bg-[#002855]/90 disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          <Check size={14} />
          {saved ? 'Signature accepted' : 'Accept signature'}
        </button>
      </div>
    </div>
  )
}
