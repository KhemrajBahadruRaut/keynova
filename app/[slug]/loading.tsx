export default function TeamMemberLoading() {
  return (
    <main className="min-h-screen bg-white px-6 pb-20 pt-32 lg:px-10">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-32 bg-slate-200" />
        <div className="mt-9 grid items-start overflow-hidden lg:grid-cols-[minmax(18rem,0.72fr)_1.28fr]">
          <div className="aspect-4/5 bg-slate-200" />
          <div className="space-y-5 px-7 py-12 sm:px-12 lg:px-16 lg:py-16">
            <div className="h-3 w-32 bg-slate-200" />
            <div className="h-12 max-w-lg bg-slate-200" />
            <div className="h-5 w-52 bg-slate-100" />
            <div className="mt-10 h-32 bg-slate-100" />
          </div>
        </div>
      </div>
    </main>
  );
}
