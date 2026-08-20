import React from "react";
import { ChevronRight } from "lucide-react";

interface ActionCard {
  id: string;
  image: string;
  title: string;
  description: string;
  href: string;
}

const cards: ActionCard[] = [
  {
    id: "buy",
    image:
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80",
    title: "Buy with us",
    description: "Find your next home with local experts guiding every step.",
    href: "/buy",
  },
  {
    id: "list",
    image:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80",
    title: "List with us",
    description: "Sell your property for the best price with our strategic marketing and extensive network.",
    href: "/list",
  },
  {
    id: "valuation",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
    title: "Home Valuation",
    description: "Discover the current market value of your property in minutes.",
    href: "/valuation",
  },
  {
    id: "contact",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    title: "Contact Us",
    description: "Get in touch with our team for personalized real estate advice.",
    href: "/contact",
  },
];

const ActionCardsPage: React.FC = () => {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {cards.map((card) => (
          <a
            key={card.id}
            href={card.href}
            className="group relative block overflow-hidden rounded-lg aspect-16/10"
          >
            <img
              src={card.image}
              alt={card.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
              <div>
                <h2 className="text-lg font-semibold text-white">{card.title}</h2>
                <p className="mt-1 max-w-xs text-sm text-white/80">{card.description}</p>
              </div>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors group-hover:bg-white/30">
                <ChevronRight size={18} />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default ActionCardsPage;