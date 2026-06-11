// ── InfoTip — popup explicativo al pasar el mouse (CSS puro, sin JS) ──────────
// Uso: <label>Cargo de pickup ($) <InfoTip text="..." /></label>

export function InfoTip({ text }: { text: string }) {
  return (
    <span className="relative inline-block group align-middle ml-1.5">
      <span
        tabIndex={0}
        className="w-3.5 h-3.5 inline-flex items-center justify-center rounded-full border border-sl-outline-variant bg-sl-bg text-[9px] font-bold text-sl-on-surface-muted cursor-help select-none group-hover:border-bronze group-hover:text-bronze transition-colors"
        aria-label={text}
      >
        i
      </span>
      <span
        role="tooltip"
        className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-72 rounded-xl bg-[#1d1b18] text-[#f5f2ec] text-[11px] leading-relaxed px-3.5 py-3 shadow-xl normal-case font-normal tracking-normal whitespace-normal text-left"
      >
        {text}
        <span className="absolute left-1/2 -translate-x-1/2 top-full border-[5px] border-transparent border-t-[#1d1b18]" />
      </span>
    </span>
  )
}
