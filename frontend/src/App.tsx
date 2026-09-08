function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-3xl text-ink">Lokkin</h1>
        <p className="font-body text-ink-soft">
          Prove what you know. Commit. Compete. Improve.
        </p>
      </header>

      <section className="rounded-card bg-white p-6 shadow-soft">
        <h2 className="text-lg">Design tokens test</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-pill bg-primary px-4 py-1.5 font-semibold text-white">Primary</span>
          <span className="rounded-pill bg-accent px-4 py-1.5 font-semibold text-white">Accent</span>
          <span className="rounded-pill bg-success px-4 py-1.5 font-semibold text-white">Success</span>
          <span className="rounded-pill bg-danger px-4 py-1.5 font-semibold text-white">Danger</span>
        </div>
        <div className="mt-4 flex gap-2">
          <span className="rounded-pill bg-primary-soft px-4 py-1.5 font-semibold text-primary-dark">12 NIM</span>
          <span className="rounded-pill bg-amber-soft px-4 py-1.5 font-semibold text-ink">03:58</span>
          <span className="rounded-pill bg-primary-faint px-4 py-1.5 font-semibold text-ink-soft">OPEN</span>
        </div>
        <button
          type="button"
          className="mt-6 w-full rounded-pill bg-primary py-3.5 font-display text-lg font-extrabold text-white shadow-lift transition-transform active:scale-[0.98]"
        >
          Enter a quiz
        </button>
        <button
          type="button"
          className="mt-3 w-full rounded-pill border-2 border-line bg-white py-3.5 font-display text-lg font-extrabold text-ink transition-transform active:scale-[0.98]"
        >
          Practice free
        </button>
      </section>

      <section className="rounded-card bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <p className="font-display font-extrabold text-ink">Cell Biology Final</p>
          <span className="rounded-pill bg-primary-faint px-3 py-1 text-xs font-bold text-primary-dark">LIVE</span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-sm text-ink-soft">
          <span className="rounded-pill bg-primary-soft px-3 py-1 font-bold text-primary-dark">50 NIM</span>
          <span>4 players</span>
          <span className="ml-auto font-semibold text-ink-muted">ends 14:30</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-pill bg-canvas-deep">
          <div className="h-full w-2/3 rounded-pill bg-primary" />
        </div>
      </section>
    </main>
  )
}

export default App
