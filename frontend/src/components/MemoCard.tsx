import { useState } from 'react'

interface MemoCardProps {
  code: string
  address: string
}

export function MemoCard({ code, address }: MemoCardProps) {
  const [copied, setCopied] = useState<'code' | 'address' | null>(null)

  const copy = async (what: 'code' | 'address', value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(what)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // clipboard unavailable — user copies manually
    }
  }

  return (
    <div className="rounded-card bg-ink p-5 text-white shadow-lift">
      <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">
        Send with this memo code
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <code className="font-display text-2xl font-extrabold tracking-widest">{code}</code>
        <button
          type="button"
          onClick={() => void copy('code', code)}
          className="rounded-pill bg-white/10 px-3 py-1.5 text-xs font-bold transition-colors hover:bg-white/20"
        >
          {copied === 'code' ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="text-xs font-semibold tracking-wide text-white/60 uppercase">
          Escrow address
        </p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <code className="truncate text-xs text-white/80">{address}</code>
          <button
            type="button"
            onClick={() => void copy('address', address)}
            className="shrink-0 rounded-pill bg-white/10 px-3 py-1.5 text-xs font-bold transition-colors hover:bg-white/20"
          >
            {copied === 'address' ? 'Copied ✓' : 'Copy'}
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-white/60">
        Your commitment is confirmed once the transaction is detected on-chain. Keep this page
        open — we check automatically.
      </p>
    </div>
  )
}
