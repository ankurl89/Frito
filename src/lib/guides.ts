/**
 * Founder Playbook — guides & how-tos for first-time apparel founders.
 *
 * Pure data (no imports) so it's usable on server or client. Content is written
 * specifically for Frito's audience: first-time D2C apparel founders in India
 * using AI to launch fast. Every guide ends with a CTA back into the product.
 *
 * `icon` is a string key mapped to a lucide icon in the UI (keeps this pure).
 * CTA hrefs may contain `{brandId}` — replaced with the real id at render.
 */

export type GuideCategory = "Start" | "Sell" | "Market" | "Grow";

export interface GuideSection {
  heading: string;
  body?: string[];                                   // paragraphs
  bullets?: string[];                                // bullet list
  steps?: { title: string; text: string }[];         // numbered steps
  tip?: string;                                       // highlighted callout
}

export interface Guide {
  slug: string;
  title: string;
  icon: string;
  category: GuideCategory;
  level: "Beginner" | "Intermediate";
  readMins: number;
  summary: string;
  intro: string;
  sections: GuideSection[];
  cta?: { label: string; href: string };
}

export const GUIDE_CATEGORIES: { key: GuideCategory; label: string; blurb: string }[] = [
  { key: "Start",  label: "Start",  blurb: "Go from idea to a live store." },
  { key: "Sell",   label: "Sell",   blurb: "Price, list, and close your first orders." },
  { key: "Market", label: "Market", blurb: "Get seen — content, ads, and free traffic." },
  { key: "Grow",   label: "Grow",   blurb: "Repeat buyers, drops, and collabs." },
];

export const GUIDES: Guide[] = [
  {
    slug: "first-sale-in-7-days",
    title: "Your first sale in 7 days",
    icon: "rocket",
    category: "Start",
    level: "Beginner",
    readMins: 6,
    summary: "The exact day-by-day plan to go from a fresh brand to a real paying customer.",
    intro:
      "Most first-time founders stall because the path feels huge. It isn't. Your only goal for week one is ONE real sale — not a perfect brand, not 50 products. One sale proves the whole machine works and changes how you feel about this forever. Here's the plan.",
    sections: [
      {
        heading: "The 7-day plan",
        steps: [
          { title: "Day 1 — Lock your brand & niche", text: "Pick one specific audience (e.g. 'anime fans who lift', not 'everyone'). Generate your brand and Brand Book in Frito. Specific beats broad every time." },
          { title: "Day 2 — Create 3 products", text: "Not 30. Pick your single best design idea and put it on the Oversized Tee, the Classic Tee, and the Hoodie. Three solid products is a store." },
          { title: "Day 3 — Polish your store", text: "Set your colours, tagline, and a one-line hero in Store Settings. Add a clear product photo (your mockups are auto-generated). Make it look like a real brand." },
          { title: "Day 4 — Price for profit", text: "Set prices that leave a healthy margin (see the pricing guide). Confirm your store link works on your phone." },
          { title: "Day 5 — Tell 20 people directly", text: "DM 20 people who fit your niche — friends, communities, group chats. Not a public post. A personal 'I launched this, would love your honest take 👇 [link]'." },
          { title: "Day 6 — Post your launch", text: "One Instagram reel or carousel + a WhatsApp status. Show the product, the story, and the link. Ask people to share." },
          { title: "Day 7 — Follow up & nudge", text: "Reply to everyone who engaged. Offer a small launch discount to the warmest 5 people. This is usually where the first sale lands." },
        ],
      },
      {
        heading: "Why this works",
        body: [
          "You're not waiting for strangers — you're activating people who already trust you. The first sale almost never comes from a cold ad; it comes from your existing network and a clear, personal ask.",
          "Once one person buys and you see the order flow through, you'll have the proof and the confidence to do it at scale.",
        ],
        tip: "Don't over-build. A founder with 3 products and 20 DMs sent beats a founder with 30 products and zero outreach, every time.",
      },
    ],
    cta: { label: "Create your first product", href: "/dashboard/{brandId}/products/new" },
  },

  {
    slug: "pricing-for-profit",
    title: "Price your apparel for profit",
    icon: "rupee",
    category: "Sell",
    level: "Beginner",
    readMins: 5,
    summary: "How to set prices that customers happily pay and that actually leave you money.",
    intro:
      "Underpricing is the #1 silent killer of new apparel brands. Print-on-demand has a real per-unit cost, so a ₹499 tee can leave you almost nothing after fulfilment and shipping. Here's how to price with confidence.",
    sections: [
      {
        heading: "Know your true cost first",
        body: [
          "Your production cost per item is shown right in the product editor — and it already includes the garment and printing, so there are no surprise costs on top. Shipping is charged to your customer at checkout.",
        ],
        bullets: [
          "Tees: ₹449–499 per item, all-in",
          "Hoodie: ₹699 · Sweatshirt: ₹599, all-in",
          "Never set a sell price below cost × 2 unless it's a deliberate loss-leader",
        ],
      },
      {
        heading: "Pick a margin that funds growth",
        body: [
          "Aim for at least a 2.5–3× markup. That margin isn't greed — it pays for the ads, discounts, and the occasional refund that growth requires. A brand with thin margins can't afford to market itself.",
        ],
        bullets: [
          "Premium tee: ₹999–1,299",
          "Hoodie: ₹1,799–2,299",
          "Sweatshirt: ₹1,499–1,799",
        ],
        tip: "Charm pricing works: ₹999 reads far cheaper than ₹1,000. End prices in 9.",
      },
      {
        heading: "Make the price feel worth it",
        body: [
          "Price is about perceived value, not just numbers. Premium photos, a strong brand story, and confident copy let you charge more. The same tee at ₹1,199 with a great brand outsells a ₹699 tee with a weak one.",
          "Offer a small first-order discount (10%) to lower the risk of the first purchase — then keep full price after.",
        ],
      },
    ],
    cta: { label: "Review your product pricing", href: "/dashboard/{brandId}/products" },
  },

  {
    slug: "descriptions-that-convert",
    title: "Write product pages that sell",
    icon: "pen",
    category: "Sell",
    level: "Beginner",
    readMins: 4,
    summary: "Turn browsers into buyers with titles, descriptions, and details that convert.",
    intro:
      "Your product page is your salesperson. Frito's AI writes a strong first draft, but the brands that convert add a human layer. Here's the formula.",
    sections: [
      {
        heading: "The title formula",
        body: ["Lead with the feeling or identity, not the fabric. 'Midnight Ronin Oversized Tee' beats 'Black 240 GSM Cotton T-Shirt'. The spec is reassurance; the name is the sale."],
      },
      {
        heading: "The description structure",
        steps: [
          { title: "Hook", text: "One line on who it's for and the vibe — 'For the ones who train in silence and let the work talk.'" },
          { title: "Details", text: "Fabric, fit, GSM, print method. Buyers need this to feel safe spending money." },
          { title: "Why it's different", text: "Your angle — limited drop, a cause, a community, a story." },
          { title: "Call to action", text: "'Drops are limited — grab yours before it's gone.'" },
        ],
      },
      {
        heading: "Details that remove doubt",
        bullets: [
          "Show the size range and a simple fit note ('true to size, size up for oversized')",
          "Mention shipping time honestly (sets expectations, reduces 'where's my order' messages)",
          "Use your real mockups so people can see exactly what arrives",
        ],
        tip: "Read your description out loud. If it sounds like a catalogue, rewrite it in your brand's voice — your Brand Book has the tone.",
      },
    ],
    cta: { label: "Open your Brand Book", href: "/dashboard/{brandId}/brand" },
  },

  {
    slug: "social-content",
    title: "Generate social content that grows your brand",
    icon: "sparkles",
    category: "Market",
    level: "Beginner",
    readMins: 6,
    summary: "A repeatable system for what to post — without burning out or hiring an agency.",
    intro:
      "You don't need to be a content creator. You need a simple system. Social is how apparel brands get discovered in India — Instagram reels especially. Here's how to never run out of things to post.",
    sections: [
      {
        heading: "Your 4 content pillars",
        body: ["Rotate between four types of posts so your feed feels alive, not like an ad reel. Your Brand Book already has pillars and post ideas tailored to your brand — use them."],
        bullets: [
          "Product — the drop, close-ups, on-body, flat-lays",
          "Story — why the brand exists, behind-the-scenes, your journey as a founder",
          "Community — reposts, customer photos, fan art, polls",
          "Value — memes, tips, or culture your audience already loves",
        ],
      },
      {
        heading: "What actually works for apparel",
        bullets: [
          "Reels > static posts for reach. Show the product moving — unboxing, try-on, design reveal.",
          "Hook in the first 1 second ('POV: you finally found anime fits that aren't cringe').",
          "Trending audio + your product = the cheapest reach you'll ever get.",
          "Post the founder's face sometimes. People buy from people, especially early.",
        ],
      },
      {
        heading: "A cadence you can keep",
        body: ["Consistency beats perfection. Start with 3 posts a week and 1 reel. Batch-create on one day so it doesn't eat your week."],
        steps: [
          { title: "Sunday", text: "Plan 3 posts using your Brand Book pillars + post ideas." },
          { title: "One filming session", text: "Shoot 3–5 short clips of your product on your phone." },
          { title: "Schedule", text: "Use Instagram's native scheduler or Meta Business Suite — free." },
        ],
        tip: "Your Brand Book includes ready-made content pillars, post themes, and hashtags for YOUR brand. Start there instead of a blank page.",
      },
    ],
    cta: { label: "See your Brand Book's social plan", href: "/dashboard/{brandId}/brand" },
  },

  {
    slug: "run-ads",
    title: "Run your first profitable ads",
    icon: "target",
    category: "Market",
    level: "Intermediate",
    readMins: 7,
    summary: "When to start ads, how much to spend, and how to not light money on fire.",
    intro:
      "Ads can pour fuel on a fire — but only once you HAVE a fire. Don't run ads until you've made a few organic sales and know which product people actually want. When you're ready, here's how to start small and smart.",
    sections: [
      {
        heading: "Before you spend a rupee",
        bullets: [
          "Have at least 3–5 organic sales so you know a product converts",
          "Install the Meta Pixel on your store so you can track results",
          "Pick your single best-selling product as the ad's hero — don't advertise the whole catalogue",
        ],
      },
      {
        heading: "Start small and structured",
        steps: [
          { title: "Budget", text: "Start at ₹300–500/day. You're buying data, not expecting riches. Run for at least 4–5 days before judging." },
          { title: "Creative", text: "Use your best-performing organic reel as the ad. Content that already worked organically usually works as an ad." },
          { title: "Audience", text: "Start broad in India (age + interest like 'anime', 'streetwear', 'fitness'). Meta's algorithm finds buyers better than you can guess." },
          { title: "Objective", text: "Choose 'Sales' (conversions), not 'Engagement'. Likes don't pay bills." },
        ],
      },
      {
        heading: "Read the only number that matters: ROAS",
        body: [
          "ROAS = revenue ÷ ad spend. If you spend ₹500 and make ₹1,500, that's 3× ROAS. For apparel with healthy margins, aim for 2.5×+ to be profitable.",
          "Kill ads that don't work after ~₹1,500–2,000 of spend. Double down on the ones that do. That's the whole game.",
        ],
        tip: "Your margin sets your break-even ROAS. If your markup is 3×, you roughly break even at ~1.5× ROAS — anything above that is profit. This is exactly why pricing for profit matters.",
      },
    ],
    cta: { label: "Make sure pricing supports ads", href: "/dashboard/{brandId}/products" },
  },

  {
    slug: "free-traffic",
    title: "Get traffic without spending on ads",
    icon: "users",
    category: "Market",
    level: "Beginner",
    readMins: 5,
    summary: "Where your first 100 visitors come from when your ad budget is zero.",
    intro:
      "You do not need an ad budget to get your first customers. Every successful brand started with scrappy, free traffic. Here's where to find it.",
    sections: [
      {
        heading: "Go where your audience already gathers",
        bullets: [
          "Reddit & Discord communities for your niche (anime, gaming, fitness) — contribute first, sell second",
          "WhatsApp & Telegram groups you're already in",
          "Instagram hashtags + commenting genuinely on bigger accounts in your space",
          "College groups, fan clubs, local meetups if your niche is regional",
        ],
      },
      {
        heading: "Make sharing irresistible",
        body: ["Your earliest customers are your best marketers. Make it effortless and rewarding for them to spread the word."],
        bullets: [
          "Drop a 'tag 2 friends' giveaway at launch",
          "Slip a thank-you card + discount code in every order for their next buy or a friend",
          "Repost every single customer photo — social proof compounds",
        ],
      },
      {
        heading: "Turn your story into reach",
        body: [
          "The 'I quit/started X to build my own brand' founder story is one of the most shareable formats on Indian social media. Document your journey publicly — building in public earns followers who become customers.",
        ],
        tip: "Free traffic is slower than ads but builds a real audience that compounds. Do this even after you start paid ads.",
      },
    ],
    cta: { label: "Customize your store before you share it", href: "/dashboard/{brandId}/settings" },
  },

  {
    slug: "launch-a-drop",
    title: "Launch a drop people actually wait for",
    icon: "zap",
    category: "Sell",
    level: "Intermediate",
    readMins: 5,
    summary: "Use scarcity and hype to turn a product launch into an event.",
    intro:
      "Streetwear taught the world this: a 'drop' sells more than an 'always available' product. Scarcity and anticipation create urgency. You can manufacture that even as a tiny brand.",
    sections: [
      {
        heading: "Build anticipation (1–2 weeks before)",
        bullets: [
          "Tease the design without fully revealing it — silhouettes, close-ups, 'coming soon'",
          "Announce an exact date and time ('Friday 8 PM')",
          "Collect interest: 'comment DROP to get the early link'",
        ],
      },
      {
        heading: "Create real scarcity",
        body: ["Limited quantity or a limited window both work. Even though print-on-demand is unlimited, a time-boxed drop ('48 hours only') is honest scarcity that drives action."],
        steps: [
          { title: "Set the window", text: "Open the drop for 48–72 hours, then 'close' it." },
          { title: "Countdown", text: "Post a countdown on Instagram stories the day of." },
          { title: "Reward early buyers", text: "First 20 orders get a freebie or discount — rewards speed." },
        ],
      },
      {
        heading: "After the drop",
        body: ["Show the results ('sold out / 50 orders in 2 hours') — success is the best marketing for your NEXT drop. Then plan the next one. A rhythm of drops keeps an audience hooked."],
        tip: "Drops also protect your energy: instead of marketing constantly, you go hard for a few days, a few times a month.",
      },
    ],
    cta: { label: "Add a drop product", href: "/dashboard/{brandId}/products/new" },
  },

  {
    slug: "repeat-customers",
    title: "Turn buyers into repeat customers",
    icon: "refresh",
    category: "Grow",
    level: "Intermediate",
    readMins: 5,
    summary: "It's 5× cheaper to sell to an existing customer. Here's how to bring them back.",
    intro:
      "The first sale is the hard one. The second is where profit lives. Most new founders forget their customers the moment an order ships — that's leaving the easiest money on the table.",
    sections: [
      {
        heading: "Nail the unboxing",
        body: ["The package IS your second ad. A thoughtful unboxing turns a buyer into a fan who posts about you for free."],
        bullets: [
          "A branded thank-you card with the founder's handwriting/voice",
          "A discount code for their next order",
          "A sticker or small extra — cheap, memorable",
        ],
      },
      {
        heading: "Capture and use email/WhatsApp",
        body: [
          "You already collect customer email at checkout. Use it. A simple flow: thank-you → ask for a review in a week → tell them about the next drop.",
          "WhatsApp broadcast lists are gold in India — high open rates and personal.",
        ],
      },
      {
        heading: "Give them a reason to return",
        bullets: [
          "Regular drops they want to come back for",
          "Loyalty perk: every 3rd order gets a discount or freebie",
          "Early access for past buyers — make them feel like insiders",
        ],
        tip: "Treat your first 100 customers like VIPs. They become your community, your reviewers, and your word-of-mouth engine.",
      },
    ],
    cta: { label: "Check your orders", href: "/dashboard/{brandId}/orders" },
  },

  {
    slug: "creator-collabs",
    title: "Grow with creator collabs",
    icon: "handshake",
    category: "Grow",
    level: "Intermediate",
    readMins: 5,
    summary: "Borrow other people's audiences — even with a tiny budget.",
    intro:
      "You don't need a celebrity. Micro-creators (5k–50k followers) in your niche have engaged, trusting audiences and are far more affordable — often just free product. This is one of the fastest ways to grow apparel in India.",
    sections: [
      {
        heading: "Find the right creators",
        bullets: [
          "Niche fit beats follower count — a 10k anime creator beats a 500k generic one for an anime brand",
          "Look at engagement (comments, not just likes) — that's real influence",
          "Check their audience is in India and matches your buyers",
        ],
      },
      {
        heading: "Make an offer they can't ignore",
        steps: [
          { title: "Start with product gifting", text: "Send a free piece, no strings. Many will post if they love it." },
          { title: "Offer an affiliate code", text: "Give them a unique discount code + a cut of sales. Aligns incentives, zero upfront cost." },
          { title: "Co-create a design", text: "A collab piece with the creator's input — they'll promote it hard because it's theirs too." },
        ],
      },
      {
        heading: "Make it easy to say yes",
        body: ["Keep your first message short, personal, and specific. Reference their actual content. Founders who send 20 thoughtful DMs land collabs; mass-copy-paste gets ignored."],
        tip: "One creator post that fits perfectly can outperform weeks of ads — and you keep the content to reuse.",
      },
    ],
    cta: { label: "Polish your store for the spotlight", href: "/dashboard/{brandId}/settings" },
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find(g => g.slug === slug);
}

export function guidesByCategory(category: GuideCategory): Guide[] {
  return GUIDES.filter(g => g.category === category);
}
