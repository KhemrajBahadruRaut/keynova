"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  DollarSign,
  FileEdit,
  Handshake,
  Home,
  Search,
  Truck,
  User,
} from "lucide-react";

import {
  resolvePageImage,
  type PageStepIcon,
  type ServicePageContent,
} from "@/lib/page-content";

const ICONS: Record<PageStepIcon, typeof Search> = {
  search: Search,
  user: User,
  home: Home,
  "dollar-sign": DollarSign,
  truck: Truck,
  "clipboard-list": ClipboardList,
  handshake: Handshake,
  "file-edit": FileEdit,
};

type BodyBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "unordered-list" | "ordered-list"; items: string[] };

function parseBody(body: string): BodyBlock[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: BodyBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ type: "heading", text: line.slice(4).trim() });
      index += 1;
      continue;
    }

    const unordered = line.startsWith("- ");
    const ordered = /^\d+\.\s+/.test(line);
    if (unordered || ordered) {
      const items: string[] = [];
      while (index < lines.length) {
        const itemLine = lines[index].trim();
        const matches = unordered
          ? itemLine.startsWith("- ")
          : /^\d+\.\s+/.test(itemLine);
        if (!matches) break;
        items.push(
          unordered
            ? itemLine.slice(2).trim()
            : itemLine.replace(/^\d+\.\s+/, "").trim(),
        );
        index += 1;
      }
      blocks.push({
        type: unordered ? "unordered-list" : "ordered-list",
        items,
      });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length) {
      const paragraphLine = lines[index].trim();
      if (
        !paragraphLine ||
        paragraphLine.startsWith("### ") ||
        paragraphLine.startsWith("- ") ||
        /^\d+\.\s+/.test(paragraphLine)
      ) {
        break;
      }
      paragraph.push(paragraphLine);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

function FormattedBody({ body }: Readonly<{ body: string }>) {
  return parseBody(body).map((block, index) => {
    if (block.type === "heading") {
      return (
        <h3 key={index} className="mt-6 font-semibold text-[#003251] first:mt-0">
          {block.text}
        </h3>
      );
    }
    if (block.type === "paragraph") return <p key={index}>{block.text}</p>;

    const List = block.type === "ordered-list" ? "ol" : "ul";
    return (
      <List
        key={index}
        className={`${
          block.type === "ordered-list" ? "list-decimal" : "list-disc"
        } space-y-1 pl-5`}
      >
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex}>{item}</li>
        ))}
      </List>
    );
  });
}

export default function ServiceStepsPage({
  content,
}: Readonly<{ content: ServicePageContent }>) {
  const [activeStep, setActiveStep] = useState(1);
  const currentIndex = Math.max(
    0,
    content.steps.findIndex((step) => step.id === activeStep),
  );
  const current = content.steps[currentIndex];
  const previous = currentIndex > 0 ? content.steps[currentIndex - 1] : null;
  const next =
    currentIndex < content.steps.length - 1
      ? content.steps[currentIndex + 1]
      : null;

  return (
    <div className="bg-white pt-22">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-0 md:grid-cols-[220px_1fr]">
        <aside className="bg-[#eef1f4] px-6 py-8">
          <p className="mb-6 text-xs font-bold tracking-wide text-[#003251]">
            {content.eyebrow}
          </p>
          <nav className="flex flex-col gap-1" aria-label={`${content.eyebrow} steps`}>
            {content.steps.map((step) => {
              const Icon = ICONS[step.icon];
              const isActive = step.id === current.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  aria-current={isActive ? "step" : undefined}
                  className={`flex flex-col items-center gap-2 rounded-md px-3 py-4 text-center text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8862a] ${
                    isActive
                      ? "bg-[#003251] text-white"
                      : "text-[#003251]/60 hover:bg-[#003251]/5"
                  }`}
                >
                  <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                  <span>{step.navLabel}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="px-6 py-8 md:px-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
            <div>
              <p className="mb-2 text-xs font-medium text-[#003251]/50">
                {current.stepLabel}
              </p>
              <h1 className="mb-4 text-2xl font-bold text-[#003251]">
                {current.title}
              </h1>

              <div className="space-y-4 text-sm leading-relaxed text-[#003251]/90">
                <FormattedBody body={current.body} />
              </div>

              <hr className="my-8 border-[#003251]/15" />
              <div className="flex items-center justify-between text-sm font-medium text-[#003251]">
                {previous ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep(previous.id)}
                    className="flex items-center gap-1 hover:underline"
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                    Previous
                  </button>
                ) : (
                  <span />
                )}
                {next ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep(next.id)}
                    className="flex items-center gap-1 hover:underline"
                  >
                    Next
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                ) : (
                  <Link
                    href={content.contactButtonHref}
                    className="flex items-center gap-1 hover:underline"
                  >
                    {content.contactButtonLabel}
                    <ChevronRight size={16} aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="aspect-4/3 w-full overflow-hidden rounded-md bg-[#003251]/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolvePageImage(current.image)}
                  alt={current.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="rounded-md border border-[#003251]/15 p-4">
                <p className="text-sm font-semibold text-[#003251]">
                  {content.contactTitle}
                </p>
                <p className="mt-1 text-xs text-[#003251]/70">
                  {content.contactText}
                </p>
                <Link
                  href={content.contactButtonHref}
                  className="mt-4 block w-full rounded-md bg-[#003251] py-2 text-center text-sm font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8862a] focus-visible:ring-offset-2"
                >
                  {content.contactButtonLabel}
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
