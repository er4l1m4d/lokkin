import { useRef, useState } from 'react'
import { Icon } from './Icon'

interface MemoCardProps {
  code: string
  address: string
}

type CopyState = 'idle' | 'copied' | 'failed'

export function MemoCard({ code, address }: MemoCardProps) {
  const [copied, setCopied] = useState<CopyState>('idle')
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copy = async (value: string) => {
    if (resetTimer.current) clearTimeout(resetTimer.current)
    try {
      await navigator.clipboard.writeText(value)
      setCopied('copied')
    } catch {
      setCopied('failed')
    }
    resetTimer.current = setTimeout(() => setCopied('idle'), 2500)
  }

  const buttonLabel = copied === 'copied' ? 'Copied!' : copied === 'failed' ? 'Copy failed' : 'Copy'

  return (
    <div className="rounded-card bg-ink p-5 text-white shadow-lift">
      <p className="text-xs font-semibold tracking-wide text-white/75 uppercase">
        Send with this memo code
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <code className="font-display text-2xl font-extrabold tracking-widest">{code}</code>
        <button
          type="button"
          onClick={() => void copy(code)}
          aria-live="polite"
          className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-pill px-4 py-2 text-xs font-bold transition-colors ${
            copied === 'failed' ? 'bg-white/20 text-white' : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          {copied === 'copied' && <Icon name="check" size={13} />}
          {buttonLabel}
        </button>
      </div>
      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="text-xs font-semibold tracking-wide text-white/75 uppercase">
          Escrow address
        </p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <code className="truncate text-xs text-white/90">{address}</code>
          <button
            type="button"
            onClick={() => void copy(address)}
            aria-live="polite"
            className={`inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-pill px-4 py-2 text-xs font-bold transition-colors ${
              copied === 'failed' ? 'bg-white/20 text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {copied === 'copied' && <Icon name="check" size={13} />}
            {buttonLabel}
          </button>
        </div>
      </div>
      {copied === 'failed' && (
        <p className="mt-2 text-xs font-semibold text-white" role="alert">
          Couldn't copy automatically — press and hold the text above to copy it.
        </p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-white/75">
        Your commitment is confirmed once the transaction is detected on-chain. Keep this page
        open — we check automatically.
      </p>
    </div>
  )
}
