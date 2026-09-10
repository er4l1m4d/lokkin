interface SkeletonProps {
  /** height utility class, e.g. "h-32" */
  className?: string
}

/** Loading placeholder block with the standard pulse */
export function Skeleton({ className = 'h-32' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-card border border-line bg-paper-deep ${className}`} aria-hidden />
}

/** Vertical stack of skeleton blocks — the standard list-loading pattern */
export function SkeletonList({
  count = 3,
  className = 'h-32',
  gap = 'gap-3',
}: {
  count?: number
  className?: string
  gap?: string
}) {
  return (
    <div className={`flex flex-col ${gap}`} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  )
}
