import { formatShellLabel } from '@/lib/appMeta'

function App() {
  return (
    <div className="flex min-h-full items-center justify-center bg-[#0b1a0f] p-4">
      <main
        className="flex aspect-video w-full max-w-5xl flex-col items-center justify-center rounded-xl border border-emerald-800/60 bg-gradient-to-b from-emerald-950 to-lime-950 shadow-2xl"
        data-testid="landscape-shell"
      >
        <h1 className="text-3xl font-bold tracking-wide text-lime-100 sm:text-4xl">
          {formatShellLabel()}
        </h1>
        <p className="mt-3 text-sm text-emerald-200/80">脚手架就绪 · PR-001</p>
      </main>
    </div>
  )
}

export default App
