import Link from "next/link";

export default function TeamMemberNotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#f4f1eb] px-6 pb-20 pt-32 text-center text-[#003251]">
      <div className="max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#c8862a]">
          Profile not found
        </p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
          This team profile is unavailable.
        </h1>
        <p className="mt-5 leading-7 text-slate-600">
          The profile may have moved or is no longer published.
        </p>
        <Link
          href="/meet-the-team"
          className="mt-8 inline-flex bg-[#003251] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#143c60]"
        >
          View all team members
        </Link>
      </div>
    </main>
  );
}
