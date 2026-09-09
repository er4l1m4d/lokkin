import { useState } from 'react'
import { Icon } from './Icon'

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
          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-pill bg-white/10 px-4 py-2 text-xs font-bold transition-colors hover:bg-white/20"
        >
          {copied === 'code' ? <><Icon name="check" size={13} /> Copied</> : 'Copy'}
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
            className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-pill bg-white/10 px-4 py-2 text-xs font-bold transition-colors hover:bg-white/20"
          >
            {copied === 'address' ? <><Icon name="check" size={13} /> Copied</> : 'Copy'}
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
