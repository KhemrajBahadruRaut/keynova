export type PageContentKey = "buywithus" | "listwithus";

export type PageStepIcon =
  | "search"
  | "user"
  | "home"
  | "dollar-sign"
  | "truck"
  | "clipboard-list"
  | "handshake"
  | "file-edit";

export interface PageContentStep {
  id: number;
  navLabel: string;
  icon: PageStepIcon;
  stepLabel: string;
  title: string;
  image: string;
  body: string;
}

export interface ServicePageContent {
  eyebrow: string;
  contactTitle: string;
  contactText: string;
  contactButtonLabel: string;
  contactButtonHref: string;
  steps: PageContentStep[];
}

export const PAGE_LABELS: Record<PageContentKey, string> = {
  buywithus: "Buy With Us",
  listwithus: "List With Us",
};

export const PAGE_ICON_OPTIONS: ReadonlyArray<{
  value: PageStepIcon;
  label: string;
}> = [
  { value: "search", label: "Search" },
  { value: "user", label: "Person" },
  { value: "home", label: "Home" },
  { value: "dollar-sign", label: "Dollar sign" },
  { value: "truck", label: "Moving truck" },
  { value: "clipboard-list", label: "Checklist" },
  { value: "handshake", label: "Handshake" },
  { value: "file-edit", label: "Document" },
];

const SHARED_CONTACT = {
  contactTitle: "Not sure where to start?",
  contactText: "Our agents can walk you through it.",
  contactButtonLabel: "Contact Us",
  contactButtonHref: "/contact",
};

const BUY_CONTENT: ServicePageContent = {
  eyebrow: "BUY WITH US",
  ...SHARED_CONTACT,
  steps: [
    {
      id: 1,
      navLabel: "Deciding to buy",
      icon: "search",
      stepLabel: "Step 1 of 6",
      title: "Making the decision to buy",
      image:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
      body: `Purchasing property is likely the largest financial decision you'll ever make. Whether you're a first-time buyer or adding to an existing portfolio, it's important to approach this step with clarity and purpose.

### Defining Your “Why”

Understanding your motivation for buying will help guide your search and narrow down your options. Consider questions like:

- Are you ready to stop paying rent and start building equity?
- Have you outgrown your current home or need more space?
- Are you interested in expanding your investment portfolio?
- Would a rental property provide additional income?
- Do you want a larger yard, a different neighborhood, or a shorter commute?

### Considering Your Financial Growth

If your income has increased, real estate can be one of the most reliable ways to put that growth to work. Whether you're searching for your dream home, a rental property, or a long-term investment, owning real estate is widely recognized as one of the least risky paths to building equity and generating returns.

Buyers who choose to work with KeyNova Group more easily match their “why” with the right property—ensuring your purchase aligns with both your lifestyle and financial goals.`,
    },
    {
      id: 2,
      navLabel: "Preparing to buy",
      icon: "user",
      stepLabel: "Step 2 of 6",
      title: "Preparing to buy",
      image:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop",
      body: `Before you begin searching for your property, a little preparation goes a long way in making the process smoother and setting you up for success.

### Build Your “Green File”

A green file is a collection of important financial documents—everything a lender will want to review when securing financing. Having these ready in advance can save valuable time. Typical items include:

- Financial statements
- Bank account records
- Investment details
- Credit card and auto loan information
- Recent pay stubs
- Tax returns for the past two years
- Copies of leases for investment properties
- Retirement account statements (401k, IRA, etc.)
- Life insurance, stocks, bonds, and mutual fund records

### Know Your Credit Standing

Your credit score plays a major role in determining both the type of property you can purchase and the terms of your financing. Check your credit early with a qualified lender. They'll review your ratings from Equifax, Experian, and TransUnion and help you understand your borrowing power. KeyNova Group can connect you with trusted lenders who specialize in residential, construction, and investment financing.

### Maintain Financial Stability

In the time leading up to your purchase, avoid big career changes or major purchases. A steady financial profile strengthens your position and makes the loan process far more seamless.`,
    },
    {
      id: 3,
      navLabel: "Choose an agent",
      icon: "user",
      stepLabel: "Step 3 of 6",
      title: "Choosing a real estate agent",
      image:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200&auto=format&fit=crop",
      body: `Purchasing a property is one of the biggest financial decisions you'll make. Between navigating paperwork, understanding complex terms, and making sound financial choices, it pays to have an expert by your side. At KeyNova Group, we don't just guide you through the process—we also provide early access to listings before they hit the general market, giving our clients an important edge.

### What to Look For in an Agent

When selecting a real estate professional, consider the following:

- Local expertise. Choose someone who truly knows the neighborhoods you're interested in.
- Availability. Ask about their responsiveness and flexibility.
- Commitment to growth. Strong agents continually sharpen their skills and stay current on trends. At KeyNova, ongoing training is a priority so our clients always benefit from the latest strategies.
- Communication. Timely responses can make or break a deal.
- Proven results. Don't hesitate to ask for past sales or client testimonials.
- Personal connection. Ultimately, you want someone who listens, understands, and makes you feel comfortable.`,
    },
    {
      id: 4,
      navLabel: "Shopping",
      icon: "home",
      stepLabel: "Step 4 of 6",
      title: "Time to go shopping",
      image:
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop",
      body: `Once those preparations are out of the way, it's time to find the right property for you.

### Take a Drive

Get to know the counties, towns, cities, and neighborhoods which interest you. Drive around and get a feel for what it would be like to own a property in the area. Start getting a sense of the properties available in those areas.

### Narrow Your Search

Select a few properties that interest you the most and have your real estate agent make appointments to see them. Your agent can help you get in to see the properties you're interested in and search for listings that fit your criteria.

### Time to Buy

Once you have picked out the property you want to make an offer on, your real estate agent can help you make an offer that the seller can accept. A good agent will investigate the potential costs and expenses associated with the new property and draft your offer in a way that gives you an advantage over other offers.`,
    },
    {
      id: 5,
      navLabel: "Escrow and appraisal",
      icon: "dollar-sign",
      stepLabel: "Step 5 of 6",
      title: "Escrow, Inspections, & Appraisal",
      image:
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1200&auto=format&fit=crop",
      body: `### Agreement and Deposit

The purchase process begins with a legally binding agreement between the buyer and the seller. A few key points to remember:

- Document everything. Put verbal agreements—such as counter-offers or changes—into writing, signed by both parties. We'll prepare and organize the necessary paperwork and make sure you receive copies.
- Follow the timeline. Once your offer is accepted, a schedule will outline each stage leading up to closing. We'll keep you updated on what to expect next.

### The Closing Agent

A closing agent—typically an attorney or title company—will hold your deposit securely in escrow, review the property's title history, ensure liens are recorded, and identify restrictions, easements, or encroachments that affect how the property can be used.

### How to Hold Title

How you hold title can affect your legal rights, estate planning, and tax obligations. We recommend consulting an attorney or tax professional to determine which option is best for you.

### Inspections

Once your offer is accepted, schedule an inspection within the timeframe in your purchase contract. A licensed home inspector will review the property's condition, and you may choose specialists such as roof, HVAC, or structural inspectors. Commercial lenders may also require an environmental audit.

Depending on the results, either contingencies are lifted and you move closer to closing, or issues are uncovered and you may request to renegotiate the contract.

### Appraisal and Financing

Stay in close contact with your lender and provide requested documents promptly. If your contract is contingent on financing, a licensed appraiser will independently assess value using square footage, construction costs, comparable sales, and income potential. Check in with your lender around two weeks before closing to confirm everything is on schedule.

### Association Approval

For condos or HOA properties, request the association's rules and application documents as soon as your agreement is in place. Submit forms and fees promptly, complete paperwork thoroughly, and schedule any required interview early. Your closing agent will make sure the approval letter is available at closing.

### Property Insurance

If you're financing your purchase, your lender will require property insurance. Compare providers, coverage, and cost. We're happy to recommend experienced insurance agents.`,
    },
    {
      id: 6,
      navLabel: "Moving in",
      icon: "truck",
      stepLabel: "Step 6 of 6",
      title: "Moving In",
      image:
        "https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=1200&auto=format&fit=crop",
      body: `### Closing Day

You're almost there—congratulations are just around the corner. Before you celebrate, take care of a few final details.

### Final Walk-Through

Usually done the day before or the day of closing, the final walk-through confirms that nothing unexpected was left behind and that all included items remain in good working order.

### Utilities and Services

After closing, you'll need to set up utilities and home services. We'll provide contacts and phone numbers to make the process easier.

### Be Ready for the Unexpected

Occasionally, last-minute issues arise. Don't stress—we've handled these situations many times and know how to resolve them quickly and smoothly.

### The Closing Itself

- The settlement agent will provide a statement outlining all financial details. You, the seller, and the closing agent will review and sign it; your lender will also provide loan paperwork.
- If you can't attend in person, alternate arrangements may be possible. Bring required funds by wire to escrow or by certified bank check as directed.
- The seller should bring all keys, garage openers, and important property information so you can officially take possession of your new home.`,
    },
  ],
};

const LIST_CONTENT: ServicePageContent = {
  eyebrow: "LIST WITH US",
  ...SHARED_CONTACT,
  steps: [
    {
      id: 1,
      navLabel: "Deciding to Sell",
      icon: "search",
      stepLabel: "Step 1 of 6",
      title: "Deciding to Sell",
      image:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
      body: `### Clarify Your Purpose

Why are you selling? Is it to upsize, relocate for school or career, downsize, or seize a new opportunity? Identifying your core motivation helps align your selling strategy with your financial goals, lifestyle aspirations, and future vision.

### Set Up a Timeline That Works for You

When do you want to sell? Whether your timeline is flexible or you need a swift move, we'll craft a tailored strategy—complete with market insights and actionable milestones—to align with your schedule and goals.

### Understand the Market

With KeyNova Group's deep local expertise and real-time data, you'll receive timely updates on pricing trends, comparable listings, and demand dynamics—empowering you to price competitively and choose the ideal moment to list.

### Optimize Your Financial Outcome

Our agents help you evaluate your financial picture, accurately estimate net proceeds, and identify opportunities for tax efficiency or estate planning—so you retain more of your profit and make confident, informed decisions.`,
    },
    {
      id: 2,
      navLabel: "Select Agent & Price",
      icon: "user",
      stepLabel: "Step 2 of 6",
      title: "Select an Agent & a Price",
      image:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop",
      body: `### Why Partner with KeyNova Group?

While selling on your own is possible, collaborating with KeyNova Group opens doors to unmatched exposure and professional support. Our marketing infrastructure—built on local insight, global connections, and a network of satisfied clients—ensures your property attracts the right attention. From listing to closing, we'll navigate the paperwork, marketing, and negotiations.

### What to Look for in an Agent

Choosing the right agent can make all the difference. Look for:

1. Expertise and credentials. Choose agents with deep industry knowledge, advanced certifications, and current market insight.
2. Local experience and marketing savvy. Your agent should understand your neighborhood and use digital, print, social, and modern marketing tools.
3. Accessibility and responsiveness. Selling requires timely action and clear communication, including evenings and weekends when necessary.
4. A strong personal connection. Choose someone who listens, understands your goals, and genuinely cares about your outcome.

### Pricing with Accuracy & Confidence

Partnering with a seasoned agent ensures your asking price is rooted in reliable market data rather than guesswork. We'll provide a comparative market analysis, assess current demand, and advise on a price that attracts buyers while maximizing your return.`,
    },
    {
      id: 3,
      navLabel: "Prepare to Sell",
      icon: "clipboard-list",
      stepLabel: "Step 3 of 6",
      title: "Prepare to Sell",
      image:
        "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?q=80&w=1200&auto=format&fit=crop",
      body: `### Make a Strong First Impression

The moment a buyer sees your property—whether driving by or scrolling online—curb appeal sets the tone. A tidy lawn, fresh mulch, trimmed shrubs, seasonal color, and a welcoming entry tell buyers your home has been well cared for.

### Small Updates, Big Payoff

You don't need a full renovation to stand out. Fresh paint, polished hardware, repaired windows, and updated lighting signal that your home is move-in ready.

### Clean, Declutter, and Stage with Intention

Help buyers envision their future by decluttering, minimizing personal items, and arranging furniture to maximize flow and natural light. Professional staging can highlight your home's best features.

### Be Transparent and Proactive

We'll help prepare accurate disclosures and can recommend structural, pest, or other pre-listing inspections. Addressing issues early builds buyer confidence and helps prevent last-minute delays.

### Professional Showings, Stress-Free Process

Let us lead showings so buyers feel comfortable, your home's strengths receive proper attention, and your privacy is protected.

### Your Next Move Starts Here

With KeyNova Group, you'll have a clear plan, expert advice, and a team dedicated to maximizing your property's value. Schedule your free home prep consultation and let's get your home market-ready with confidence.`,
    },
    {
      id: 4,
      navLabel: "Accepting an Offer",
      icon: "handshake",
      stepLabel: "Step 4 of 6",
      title: "Accepting an Offer",
      image:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200&auto=format&fit=crop",
      body: `### Not All High Prices Are Equal

A lofty offer might catch your eye, but it's only part of the story. Conditions, contingencies, and financing terms can affect the outcome. We'll help you assess each proposal holistically so you choose a winning offer, not just a big number.

### Mastering the Art of Negotiation

We approach counteroffers, contingencies, and multiple bids with a clear ethical commitment and the goal of mutual benefit. Every decision stays informed, fair, and aligned with your interests.

### Understanding Agreements & Earnest Deposits

A signed agreement is a legal commitment. Earnest money is held in escrow until contingencies are met. We'll explain the funds, timelines, and requirements so you can proceed with clarity.

### Keep Everything Clear and on Track

- Document everything. Turn verbal counteroffers or amendments into written, signed documents. We'll organize your paperwork and copies.
- Stick to the timeline. Every phase has dates and deadlines. We'll keep you informed, prepared, and on schedule.

### Your Strategic Edge in Offer Negotiations

With KeyNova Group, you're selecting the right path forward. We'll protect your interests and help every decision move you closer to the outcome you want.`,
    },
    {
      id: 5,
      navLabel: "Escrow and appraisal",
      icon: "dollar-sign",
      stepLabel: "Step 5 of 6",
      title: "Escrow, Inspections, & Appraisal",
      image:
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1200&auto=format&fit=crop",
      body: `### Escrow: Your Transaction's Trust Anchor

Once you and your buyer agree on terms, a neutral third party—typically an attorney—securely holds the earnest deposit and critical documents. Funds are exchanged only when agreed conditions are met.

### Inspections: Transparency Builds Confidence

The buyer arranges a general home inspection and may add termite, roof, radon, or other specialty inspections. Findings inform fair negotiation of repairs, credits, or contract adjustments.

### Appraisals: Verified Value, Informed Decisions

For financed purchases, the buyer's lender orders an independent appraisal based on condition, location, and comparable sales. If value comes in below the agreed price, the purchase price or how the difference is covered may need to be renegotiated.

### Staying on Track Through Contingencies

Your escrow agent monitors inspection, appraisal, and financing milestones so each condition is adequately addressed before moving forward.

### Closing Preparations: Final Checks & Paperwork

- Final walk-through: The buyer verifies agreed repairs and overall condition.
- Documentation: Disclosures, title work, and other legal paperwork are finalized.
- Closing: Escrow distributes funds, clears liens, records the deed, and transfers ownership.

### Your Clear Path Forward

With KeyNova Group, escrow becomes streamlined, inspections feel purposeful, and appraisal outcomes become navigable. We guide you at each step, protect your interests, and keep your sale moving confidently toward the finish line.`,
    },
    {
      id: 6,
      navLabel: "Close of Escrow",
      icon: "file-edit",
      stepLabel: "Step 6 of 6",
      title: "Close of Escrow",
      image:
        "https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=1200&auto=format&fit=crop",
      body: `### The Final Chapter: Securing the Sale with Confidence

The closing of escrow marks the final step in your home-selling journey—where all agreed terms are fulfilled, funds are released, and ownership officially changes hands.

### Step-by-Step: What Happens at Close of Escrow

### 1. Document Signing & Loan Finalization

Buyer and seller sign the deed, loan paperwork, disclosures, and settlement statements. The lender finalizes financing and legal documents are prepared for recording.

### 2. Funding & Disbursement

The lender transfers necessary funds into escrow. The settlement agent pays existing loans and commissions, then releases net proceeds to you.

### 3. Title Recording & Ownership Transfer

The deed and, when applicable, the mortgage are recorded with the county. The sale is then official and ownership legally transfers.

### 4. Post-Closing Essentials

Title insurance is issued, documents are archived, and funds are disbursed. You'll receive confirmation and closing disclosures for your records.`,
    },
  ],
};

export const DEFAULT_PAGE_CONTENT: Record<
  PageContentKey,
  ServicePageContent
> = {
  buywithus: BUY_CONTENT,
  listwithus: LIST_CONTENT,
};

export function clonePageContent(pageKey: PageContentKey): ServicePageContent {
  const content = DEFAULT_PAGE_CONTENT[pageKey];
  return {
    ...content,
    steps: content.steps.map((step) => ({ ...step })),
  };
}

export function resolvePageImage(image: string): string {
  const source = image.trim();
  if (!source || /^https?:\/\//i.test(source) || source.startsWith("/")) {
    return source;
  }

  const apiBase = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
  if (!apiBase) return `/uploads/${source.replace(/^uploads\//, "")}`;
  return `${apiBase}/uploads/${source.replace(/^uploads\//, "")}`;
}
