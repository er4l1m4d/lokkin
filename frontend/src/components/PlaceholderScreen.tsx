export function PlaceholderScreen({ name }: { name: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
      <p className="text-3xl" aria-hidden>
        🚧
      </p>
      <h1 className="font-display text-xl font-extrabold text-ink">{name}</h1>
      <p className="text-sm text-ink-soft">Coming in the next phase</p>
    </div>
  )
}
