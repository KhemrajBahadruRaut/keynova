import Link from "next/link";
import {
  ArrowRight,
  Check,
  Compass,
  Layers3,
  MoveUpRight,
  Target,
} from "lucide-react";

const story = {
  introduction:
    "KeyNova Group is a forward-thinking real estate brokerage redefining how people buy, sell, and invest in property across Greater Boston, Greater Lowell, Worcester County, Southern New Hampshire, and beyond. At our core, we believe real estate should feel empowering, not overwhelming—and our clients are always the focus of our work.",
  philosophy:
    "Our guiding philosophy is built on efficiency, simplicity, and precision-engineered systems to make buying and selling real estate a simple and rewarding process. These aren’t just principles—they’re the backbone of how we strip away the chaos, cut through the noise, and deliver a seamless experience that lets our clients focus on what matters: their vision, their goals, their future.",
  leadership:
    "Led by Co-Founders Suraj Tamrakar, Marty Conley, Brendan Conley, and Marty Conley Sr., KeyNova Group blends sharp market insight with a modern, strategic approach that empowers clients to unlock the next chapter of their homeownership journey. From first-time buyers to seasoned investors, we craft clear pathways forward, giving clients the confidence and clarity to make bold moves.",
  closing:
    "With a growing record of transformative deals and community-focused projects, KeyNova Group isn’t just another brokerage—we’re the trusted guide who helps you unlock your future.",
} as const;

const markets = [
  "Greater Boston",
  "Greater Lowell",
  "Worcester County",
  "Southern New Hampshire",
  "And beyond",
] as const;

const principles = [
  {
    title: "Efficiency",
    description:
      "Purposeful systems that keep every decision and milestone moving forward.",
    Icon: Layers3,
  },
  {
    title: "Simplicity",
    description:
      "Clear guidance that cuts through the noise and makes the process easier to navigate.",
    Icon: Compass,
  },
  {
    title: "Precision",
    description:
      "A considered strategy shaped around your market, priorities, and long-term goals.",
    Icon: Target,
  },
] as const;

const founders = [
  "Suraj Tamrakar",
  "Marty Conley",
  "Brendan Conley",
  "Marty Conley Sr.",
] as const;

export function AboutPreview() {
  return (
    <section className="overflow-hidden bg-[#f4f1eb] px-6 py-20 sm:py-24 lg:px-10">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="relative min-h-80 overflow-hidden rounded-4xl bg-[#0b2540] p-8 text-white sm:p-12">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-[#c8862a]/15" />

          <div className="relative flex h-full min-h-64 flex-col justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10">
              <Compass aria-hidden="true" className="h-5 w-5 text-[#e4ad60]" />
            </div>
            <blockquote className="max-w-md text-2xl font-medium leading-snug sm:text-3xl">
              “Real estate should feel empowering, not overwhelming.”
            </blockquote>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#a66b1c]">
            About KeyNova
          </p>
          <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-[#0b2540] sm:text-5xl">
            Real estate, reengineered around you.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            {story.introduction}
          </p>
          <Link
            href="/about"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0b2540] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#143c60]"
          >
            Discover our story
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function AboutSection() {
  return (
    <div className="bg-white text-[#0b2540]">
      <section className="relative overflow-hidden bg-[#0b2540] px-6 pb-20 pt-36 text-white sm:pb-28 sm:pt-44 lg:px-10">
        <div className="absolute -right-32 top-20 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -right-12 top-40 h-72 w-72 rounded-full border border-[#c8862a]/30" />
        <div className="absolute bottom-0 left-0 h-32 w-1/3 bg-linear-to-r from-[#c8862a]/15 to-transparent" />

        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#e4ad60]">
            About KeyNova Group
          </p>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-20">
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Your future is the focus of our work.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
              {story.introduction}
            </p>
          </div>

          <div className="mt-14 flex flex-wrap gap-3 border-t border-white/15 pt-8">
            {markets.map((market) => (
              <span
                key={market}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85"
              >
                <Check aria-hidden="true" className="h-3.5 w-3.5 text-[#e4ad60]" />
                {market}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-28 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#a66b1c]">
                How we work
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
                Less chaos. More clarity.
              </h2>
            </div>
            <p className="max-w-3xl text-lg leading-9 text-slate-600 sm:text-xl">
              {story.philosophy}
            </p>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {principles.map(({ title, description, Icon }, index) => (
              <article
                key={title}
                className="group rounded-3xl border border-slate-200 bg-[#f8fafc] p-7 transition hover:-translate-y-1 hover:border-[#c8862a]/40 hover:shadow-xl hover:shadow-slate-900/5 sm:p-8"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b2540] text-white">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold tracking-widest text-slate-400">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-9 text-2xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f1eb] px-6 py-20 sm:py-28 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#a66b1c]">
              Our leadership
            </p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              Market insight meets modern strategy.
            </h2>
            <p className="mt-7 max-w-3xl text-lg leading-9 text-slate-600">
              {story.leadership}
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/5">
            {founders.map((founder, index) => (
              <div
                key={founder}
                className="flex items-center justify-between gap-5 border-b border-slate-100 px-6 py-5 last:border-b-0 sm:px-8"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0b2540] text-xs font-semibold text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-semibold text-[#0b2540]">{founder}</p>
                    <p className="mt-0.5 text-sm text-slate-500">Co-Founder</p>
                  </div>
                </div>
                <MoveUpRight aria-hidden="true" className="h-4 w-4 text-[#c8862a]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-28 lg:px-10">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-4xl bg-[#0b2540] px-7 py-14 text-center text-white sm:px-14 sm:py-20">
          <div className="absolute -left-20 -top-28 h-72 w-72 rounded-full bg-[#c8862a]/15" />
          <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full border border-white/10" />
          <div className="relative mx-auto max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#e4ad60]">
              Unlock what comes next
            </p>
            <h2 className="mt-5 text-3xl font-semibold leading-tight sm:text-5xl">
              A trusted guide for your next move.
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-white/75 sm:text-lg">
              {story.closing}
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/listing"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c8862a] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#b77722]"
              >
                Explore properties
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white hover:text-[#0b2540]"
              >
                Start a conversation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
