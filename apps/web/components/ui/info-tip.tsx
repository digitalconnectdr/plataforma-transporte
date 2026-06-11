'use client'
// ── InfoTip — popup explicativo (hover en desktop, tap en móvil) ──────────────
// Versión con estado: más confiable que CSS group-hover dentro de labels.
// Uso: <label>Cargo de pickup ($) <InfoTip text="..." /></label>

import { useEffect, useRef, useState } from 'react'

export function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  // Cerrar al hacer clic fuera (para el modo tap)
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <span
      ref={ref}
      className="relative inline-block align-middle ml-1.5"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          setOpen((v) => !v)
        }}
        aria-label={text}
        aria-expanded={open}
        className={`w-4 h-4 inline-flex items-center justify-center rounded-full border text-[9px] font-bold cursor-help select-none transition-colors ${
          open
            ? 'border-bronze text-bronze bg-bronze/10'
            : 'border-sl-outline-variant bg-sl-bg text-sl-on-surface-muted'
        }`}
      >
        i
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-[100] w-72 rounded-xl bg-[#1d1b18] text-[#f5f2ec] text-[11px] leading-relaxed px-3.5 py-3 shadow-2xl normal-case font-normal tracking-normal whitespace-normal text-left block"
        >
          {text}
          <span className="absolute left-1/2 -translate-x-1/2 top-full border-[6px] border-transparent border-t-[#1d1b18]" />
        </span>
      )}
    </span>
  )
}
