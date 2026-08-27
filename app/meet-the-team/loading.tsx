export default function MeetTheTeamLoading() {
  return (
    <main className="min-h-screen bg-white px-6 pb-20 pt-36 lg:px-10">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-32 bg-slate-200" />
        <div className="mt-5 h-12 max-w-2xl bg-slate-200" />
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index}>
              <div className="aspect-[4/5] bg-slate-200" />
              <div className="mt-4 h-5 w-3/5 bg-slate-200" />
              <div className="mt-2 h-4 w-4/5 bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
