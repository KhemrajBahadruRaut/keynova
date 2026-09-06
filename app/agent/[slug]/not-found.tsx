import Link from "next/link";

export default function AgentLandingNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-[#003251]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1c878f]">KeyNova Group</p>
        <h1 className="mt-4 text-4xl font-semibold">This agent page is unavailable.</h1>
        <Link href="/meet-the-team" className="mt-7 inline-flex bg-[#003251] px-6 py-3 text-sm font-semibold text-white">
          Meet the team
        </Link>
      </div>
    </main>
  );
}
