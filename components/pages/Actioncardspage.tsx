import { ChevronRight } from "lucide-react";

import {
  HOMEPAGE_ACTION_CARD_DETAILS,
  resolveHomepageActionImage,
  type HomepageActionContent,
} from "@/lib/homepage-action-content";

export default function ActionCardsPage({
  content,
}: Readonly<{ content: HomepageActionContent }>) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {content.cards.map((card) => {
          const details = HOMEPAGE_ACTION_CARD_DETAILS[card.id];
          return (
            <a
              key={card.id}
              href={details.href}
              className="group relative block overflow-hidden rounded-lg aspect-16/10"
            >
              <img
                src={resolveHomepageActionImage(card.image)}
                alt={details.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                <div>
                  <h2 className="text-lg font-semibold text-white">{details.title}</h2>
                  <p className="mt-1 max-w-xs text-sm text-white/80">
                    {details.description}
                  </p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors group-hover:bg-white/30">
                  <ChevronRight size={18} />
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
