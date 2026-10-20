import type { Locale } from "@/i18n/config";
import type { ShowcaseId } from "@/data/showcase";

/**
 * English dictionary — the type source of truth for every locale.
 * Honest placeholders (email note, "—" stats, concept disclaimers) are
 * preserved verbatim in meaning across locales.
 */

type ShowcaseCopy = {
  kind: "service" | "result";
  category: string;
  title: string;
  alt: string;
  summary: string;
  deliverables?: string[];
  metrics?: { label: string; value: string }[];
};

export type ServiceCopy = {
  title: string;
  description: string;
  /** Optional capability chips (used by the content-creation card). */
  tags?: string[];
};

type ProjectCopy = {
  title: string;
  alt: string;
  sector?: string;
  summary: string;
  brief: string;
  approach: string;
  deliverables: string[];
  /** Alt text for the extra gallery visuals, matched by index. */
  galleryAlt?: string[];
};

export const en = {
  /** Widened to the Locale union so `ar.ts` can satisfy the same type. */
  locale: "en" as Locale,

  meta: {
    title: "Ideas that reach further.",
    description:
      "A full-service creative and digital agency helping ambitious brands reach further.",
  },

  nav: {
    links: [
      { label: "Home", href: "#home" },
      { label: "About", href: "/about" },
      { label: "Services", href: "#services" },
      { label: "Results", href: "#results" },
      { label: "Our work", href: "#work" },
      { label: "Contact", href: "#contact" },
    ],
    menuOpen: "Open navigation menu",
    menuClose: "Close navigation menu",
    navAria: "Primary",
    overlayAria: "Main navigation",
    requestCta: "Request service",
    logoAria: "Reach Agency home",
    skipToContent: "Skip to content",
  },

  language: {
    aria: "Switch language",
    currentSuffix: "current language",
    switchTo: { en: "Switch to Arabic — العربية", ar: "Switch to English — EN" },
    footerHeading: "Language",
  },

  preloader: {
    label: "Loading",
    status: "Loading Reach Agency",
  },

  hero: {
    eyebrow: "Independent creative studio",
    title: ["IDEAS THAT", "REACH", "FURTHER."],
    titleAria: "Ideas that reach further",
    description: "A full-service creative and digital agency.",
    primaryCta: "Request service",
    secondaryCta: "See selected work",
    scrollCue: "Scroll to explore",
    socialAria: "Reach Agency on social media",
    socialMissing: "%s — link not configured yet. Add it in src/data/brand.ts.",
  },

  services: {
    eyebrow: "What we do",
    lines: ["Empowering brands through", "innovative and modern solutions"],
    description:
      "We bring strategy, design, and digital innovation together to help your brand move forward with purpose.",
    items: [
      {
        title: "Digital Marketing",
        description: "Smart campaigns built to grow awareness and turn attention into measurable results.",
      },
      {
        title: "Brand Identity",
        description: "Distinctive visual identities that capture your character and make your brand memorable.",
      },
      {
        title: "Social Media",
        description: "Thoughtful strategy and content that gives your brand a more meaningful presence.",
      },
      {
        title: "Web Development",
        description: "Digital experiences that feel unmistakably yours and make every visit count.",
      },
      {
        title: "Artificial Intelligence",
        description: "Practical AI workflows that speed up research, production, and reporting — while the creative judgement stays human.",
      },
      {
        title: "Content Creation",
        description:
          "Scroll-stopping photos, reels, and UGC built around your product and the way people actually use it.",
        tags: ["Photos", "Reels", "UGC"],
      },
    ] as ServiceCopy[],
    cardAriaSuffix: " — start a project",
  },

  milestones: {
    eyebrow: "About us",
    lines: ["A decade of experience.", "Results that speak in numbers."],
    description:
      "Your strategic partner for digital growth. For more than 10 years we have managed advertising budgets beyond E£150 million — turned into record sales and real ROI.",
    stats: [
      { value: "+10", label: "Years of experience" },
      { value: "+150M", label: "EGP in ad budgets managed" },
    ],
    note: "Egypt · Saudi Arabia · UAE · Qatar · Malaysia · United Kingdom",
    readMore: "Read our full story",
  },

  about: {
    meta: {
      title: "About us",
      description:
        "A decade of experience and results that speak in numbers. Reach Agency is your strategic partner for digital growth across Egypt, the Gulf, Malaysia, and the UK.",
    },
    eyebrow: "About us",
    title: "A decade of experience. Results that speak in numbers.",
    lead:
      "We are your strategic partner for digital growth; we put in your hands the essence of more than 10 years of experience in building success and developing brands. Over a full decade, we have managed advertising investments and budgets that surpassed E£150 million, converting them into record sales and real return on investment (ROI) for our clients.",
    sectorsHeading: "Our mark in the most competitive industries",
    sectors: [
      {
        title: "Real estate development & marketing",
        copy: "Leading large-scale campaigns and attracting qualified high-ticket leads to drive billion-scale sales for developers and real-estate companies.",
      },
      {
        title: "Luxury fashion",
        copy: "Building a refined digital identity and precise targeting of the highest-value buyer segments.",
      },
      {
        title: "Local businesses",
        copy: "Fast, effective acquisition strategies that take hold of the local market and multiply sales.",
      },
    ],
    markets:
      "We started in Egypt, and our impact now reaches Saudi Arabia, the UAE, Qatar, Malaysia, and the United Kingdom — combining original creativity with precise data analysis, grounded in a deep understanding of consumer behaviour across Arab and global markets.",
    counters: [
      { value: "+10", label: "Years of experience" },
      { value: "+150M", label: "EGP in ad budgets managed" },
    ],
    whatsappCta: "Chat on WhatsApp",
    backHome: "Back to home",
  },

  marquee: {
    words: ["Strategy", "Design", "Digital", "Growth", "Identity", "Motion", "Experience", "Reach further"],
    aria: "What we believe about ideas",
  },

  principles: {
    aria: "Our vision and mission",
    items: [
      {
        symbol: "◎",
        title: "Our vision",
        copy: "To be the creative partner that helps ambitious brands build a digital presence with lasting impact.",
      },
      {
        symbol: "↗",
        title: "Our mission",
        copy: "We turn ideas into meaningful brand stories through creativity, strategy, and thoughtful digital experiences.",
      },
    ],
  },

  results: {
    eyebrow: "Client results",
    lines: ["Campaigns that", "moved the numbers."],
    description:
      "A selection of paid-media and e-commerce campaigns we ran for clients — tap any card to open the report and the campaign details.",
    aria: "Client sales results",
    trackAria: "Scrolling gallery of campaign result reports",
    openHint: "View campaign details",
    close: "Close campaign details",
    dialogAria: "Campaign details",
    metricLabels: {
      sales: "Total sales",
      orders: "Orders",
      conversion: "Conversion rate",
      aov: "Average order value",
      period: "Reporting period",
    },
    periodSuffix: "days",
    cases: {
      "ecommerce-strong": {
        title: "Strong sales for our client",
        subtitle: "E-commerce sales case study",
        market: "Egypt",
        alt: "E-commerce sales report showing E£5.9 million in total sales, 1,749 orders, and a 1% conversion rate over 365 days",
        summary:
          "A full-year e-commerce campaign that more than doubled sales versus the previous period. Total sales reached E£5.9M (+107%) from 1,749 orders (+14%) at a 1% conversion rate.",
      },
      "ecommerce-case": {
        title: "Strong sales for our client",
        subtitle: "E-commerce sales case study",
        market: "Egypt",
        alt: "E-commerce sales report showing E£4.9 million in total sales, 752 orders, and a 0.7% conversion rate over 365 days",
        summary:
          "A year-long e-commerce campaign delivering E£4.9M in sales from 752 orders, with a 0.7% conversion rate across the reporting period.",
      },
      "mens-fashion-egypt": {
        title: "Standout sales for our client in Egypt",
        subtitle: "Men's fashion case study",
        market: "Egypt · Diverso Shop",
        alt: "Diverso Shop men's fashion report showing E£38.4 million in total sales, 6,676 orders, and a 0.6% conversion rate",
        summary:
          "A men's fashion campaign in Egypt for Diverso Shop. Over 365 days the store reached E£38.4M in sales (+88%) and 6,676 orders (+29%), with a 0.6% conversion rate and an average order value of E£5,752.",
      },
      "luxury-womens-egypt": {
        title: "Luxury women's shoes, bags and accessories in Egypt",
        subtitle: "Luxury women's shoes, bags & accessories — Egypt",
        market: "Egypt",
        alt: "Luxury women's accessories report showing E£5.2 million in total sales, 1,059 orders, and a 0.9% conversion rate over 365 days",
        summary:
          "A luxury women's shoes, bags and accessories campaign in Egypt. Over 365 days the store recorded E£5.2M in sales from 1,059 orders at a 0.9% conversion rate.",
      },
      "luxury-mens-shoes-egypt": {
        title: "Luxury men's shoes in Egypt",
        subtitle: "Luxury men's shoes — Egypt",
        market: "Egypt",
        alt: "Luxury men's shoes report showing E£4.9 million in total sales, 752 orders, and a 0.7% conversion rate over 365 days",
        summary:
          "A luxury men's shoes campaign in Egypt. Over 365 days the store recorded E£4.9M in sales from 752 orders at a 0.7% conversion rate.",
      },
      "air-freshener-malaysia": {
        title: "Standout sales for our client in Malaysia",
        subtitle: "Air freshener case study — Malaysia",
        market: "Malaysia",
        alt: "Malaysia air freshener report showing RM195,368 in total sales, 3,793 orders, and a 1.5% conversion rate over 30 days",
        summary:
          "A 30-day air freshener campaign in Malaysia. Sales reached RM195,368 (+12%) from 3,793 orders (+18%), with conversion at 1.5% (+0.7) and an average order value of RM51.5.",
      },
    } as Record<string, {
      title: string;
      subtitle: string;
      market: string;
      alt: string;
      summary: string;
    }>,
  },

  showcase: {
    eyebrow: "Services & outcomes",
    lines: ["Services we deliver.", "Outcomes we can prove."],
    description:
      "A closer look at the services we offer and campaigns we have already delivered — tap any image to read the full details.",
    trackAria: "Scrolling gallery of services and campaign outcomes",
    openHint: "Open full details",
    close: "Close details",
    dialogAria: "Service and campaign details",
    serviceLabel: "Service",
    resultLabel: "Campaign result",
    deliverablesHeading: "What we deliver",
    highlightsHeading: "Campaign highlights",
    items: {
      "brand-story": {
        kind: "service",
        category: "Storytelling & content",
        title: "Your brand has a story. Let’s tell it right.",
        alt: "Storytelling service poster showing a writer working in a notebook beside a microphone",
        summary:
          "We start with the idea, shape it into a clear story, then turn it into content and design that carry your brand’s personality. The goal is simple: your audience should understand who you are, why you matter, and what value you bring.",
        deliverables: [
          "Story and messaging strategy",
          "Creative copywriting",
          "Visual content design",
        ],
      },
      "visual-identity": {
        kind: "service",
        category: "Visual identity",
        title: "One coherent identity, down to every detail.",
        alt: "Visual identity poster showing a tote bag, stationery, cards and colour swatches in purple and yellow",
        summary:
          "We build a complete visual system that unifies your brand across the logo, colours and typography, through to print, packaging and social templates — so every touchpoint feels professional and unmistakably yours.",
        deliverables: [
          "Logo, colour and type system",
          "Print and packaging",
          "Social media templates",
        ],
      },
      "personal-brand": {
        kind: "service",
        category: "Personal branding",
        title: "Make your brand a personality, not just a logo.",
        alt: "Personal branding poster showing a purple bag, box and printed cards carrying the REACH mark",
        summary:
          "We turn your expertise and character into a clear visual presence: a story, a tone of voice, and an identity applied consistently across platforms and print, helping your audience build trust faster.",
        deliverables: [
          "Brand personality direction",
          "Personal visual identity",
          "Content templates",
        ],
      },
      "web-experience": {
        kind: "service",
        category: "Websites & e-commerce",
        title: "A website that introduces you and makes ordering easy.",
        alt: "Website design poster showing a shoe store on a laptop and phone with a purple and yellow interface",
        summary:
          "We design and build a fast, mobile-first web experience: clear information architecture, an intuitive interface, and product pages that guide visitors step by step to checkout.",
        deliverables: [
          "UX and UI design",
          "Responsive build",
          "Store or website development",
        ],
      },
      "paid-ads": {
        kind: "service",
        category: "Paid advertising",
        title: "Your ad reaches the right people.",
        alt: "Paid advertising poster showing a megaphone beside a phone displaying a shoe product",
        summary:
          "We plan campaigns on the platforms your audience actually uses, test messaging, audiences and creative, then track the numbers and keep improving. The goal is not reach alone, but reach that turns attention into enquiries and sales.",
        deliverables: [
          "Targeting and media plans",
          "A/B testing and optimisation",
          "Performance reporting",
        ],
      },
      "digital-marketing": {
        kind: "service",
        category: "Digital marketing",
        title: "Focus on your business. Leave marketing to us.",
        alt: "Digital marketing poster showing a young man working on a laptop in a yellow armchair",
        summary:
          "We run your digital presence as one system — ads, content and website — with a clear plan and continuous measurement. You stay focused on running the business; we make sure the right message reaches the right audience.",
        deliverables: [
          "Digital marketing plan",
          "Content and campaign management",
          "Tracking and performance reviews",
        ],
      },
      "full-service": {
        kind: "service",
        category: "Integrated solutions",
        title: "Start anywhere. This is what we do.",
        alt: "REACH services poster showing a yellow armchair, laptop and notebook",
        summary:
          "Whether you need one service or a full system, we start from your business goal and define the market, message and channels. Strategy, design, execution and measurement sit under one roof.",
        deliverables: [
          "Goal and market definition",
          "End-to-end execution plan",
          "One team from idea to measurement",
        ],
      },
      "real-estate-strategy": {
        kind: "service",
        category: "Real-estate marketing",
        title: "Your property project needs a plan.",
        alt: "Real-estate marketing poster showing a hand placing a pin on a residential project model",
        summary:
          "We build the campaign around the unit types, project location, target audience and sales goal. Each stage gets its own message, and we target qualified buyers instead of chasing broad reach.",
        deliverables: [
          "Real-estate campaign strategy",
          "Qualified-buyer targeting",
          "Messaging by unit type and sales stage",
        ],
      },
      "dental-results": {
        kind: "result",
        category: "Campaign result · Dental clinic",
        title: "730 clinic bookings from a single campaign.",
        alt: "Dental clinic campaign report showing 730 bookings, an average cost of E£25 per booking and E£18,250 total spend",
        summary:
          "A dental-clinic ad campaign generated 730 bookings at the clinic, at an average cost of E£25 per booking and a total approximate spend of E£18,250, based on the client’s data.",
        metrics: [
          { label: "Bookings", value: "730" },
          { label: "Avg. cost per booking", value: "E£25" },
          { label: "Total spend", value: "E£18,250" },
        ],
      },
      "ecommerce-performance": {
        kind: "result",
        category: "Campaign result · E-commerce",
        title: "68 purchases at a 13.34× return on ad spend.",
        alt: "E-commerce campaign report showing 68 purchases, $494.52 ad spend, $7.27 cost per purchase and a 13.34× return on ad spend",
        summary:
          "The last 30 days of an e-commerce campaign: 68 website purchases, $494.52 ad spend, $7.27 cost per purchase, and a 13.34× return on ad spend. Figures are recorded in Meta Ads Manager; ROAS does not represent net profit.",
        metrics: [
          { label: "Purchases", value: "68" },
          { label: "Ad spend", value: "$494.52" },
          { label: "Cost per purchase", value: "$7.27" },
          { label: "ROAS (not net profit)", value: "13.34×" },
        ],
      },
      "ecommerce-revenue": {
        kind: "result",
        category: "Campaign result · E-commerce",
        title: "$6,598.60 in campaign-attributed purchases.",
        alt: "E-commerce campaign report showing $6,598.60 in website purchase value over the last 30 days",
        summary:
          "The campaign’s recorded website purchase value reached $6,598.60 over the last 30 days, according to Meta Ads Manager. The figure represents sales attributed to the campaign, not net profit.",
        metrics: [
          { label: "Purchase value", value: "$6,598.60" },
          { label: "Period", value: "Last 30 days" },
          { label: "Source", value: "Meta Ads Manager" },
        ],
      },
      "real-estate-results": {
        kind: "result",
        category: "Campaign result · Real estate",
        title: "1.6K conversations started from the ad.",
        alt: "Real-estate campaign report showing about 1,600 conversations, E£14.67K ad spend and E£9.33 cost per conversation",
        summary:
          "A real-estate campaign produced around 1,600 conversations initiated from the ad, with approximately E£14.67K in ad spend and a E£9.33 cost per conversation. Figures come from Meta Ads Manager; the reporting period is not shown in the image.",
        metrics: [
          { label: "Conversations", value: "1.6K" },
          { label: "Approx. ad spend", value: "E£14.67K" },
          { label: "Cost per conversation", value: "E£9.33" },
        ],
      },
    } as Record<ShowcaseId, ShowcaseCopy>,
  },

  work: {
    eyebrow: "Selected work",
    lines: ["Creativity is a matter of perspective.", "Ours is always moving forward."],
    filtersAria: "Filter projects by category",
    gridAria: "Selected client projects and concept work",
    empty: "New work for this category is coming soon.",
    disclaimer:
      "A mix of delivered client work and visual concept projects — every card is labelled with its type.",
    projectTypes: {
      client: "Client project",
      concept: "Concept project",
    },
    categories: {
      all: "View All",
      branding: "Branding",
      social: "Social Media",
      dev: "Programming and Design",
      photo: "Photography",
      video: "Videography",
    },
    projectPage: {
      backToWork: "Back to selected work",
      conceptLabel: "Visual concept · temporary custom artwork",
      clientLabel: "Client project · delivered work",
      clientMetaLabel: "Client",
      sectorLabel: "Sector",
      overviewHeading: "The idea",
      approachHeading: "Creative direction",
      deliverablesHeading: "Scope of work",
      conceptDeliverablesHeading: "Concept elements",
      galleryHeading: "Project gallery",
      nextProject: "Next project",
      contactCta: "Have a project in mind?",
      contactLink: "Let’s talk",
      imageCaption: "Temporary visual concept",
      clientImageCaption: "Selected work from the project",
    },
    projects: {
      greens: {
        title: "Greens: product stories that sell",
        alt: "Greens agriculture campaign design showing the Vapcomic Gold pack and product details",
        sector: "Agriculture · Crop protection & fertilisers",
        summary:
          "A social campaign system for Greens' agricultural products, pairing a clear product hero with active-ingredient details and a direct WhatsApp order line.",
        brief:
          "Greens needed to present a technical range of pesticides and fertilisers in a way farmers could read in seconds — without losing the consistency of the brand across every product.",
        approach:
          "Each layout leads with the product pack, then layers colour-coded facts, pack size, and a permanent order strip. The result is a repeatable template that makes every product instantly recognisable.",
        deliverables: [
          "Product social media designs",
          "Advertising copy for each product",
          "A consistent campaign layout system",
        ],
        galleryAlt: [
          "Greens Wenestor pesticide design with the pack and active-ingredient details",
          "Greens Calcimax fertiliser design on a green field background",
          "Greens Commando pesticide design with the bottle and product information",
          "Greens Verimax Veta fertiliser box design",
          "Greens Sien Mix Extra micronutrients design in a field",
          "Greens Sien Zinc design with product benefits",
        ],
      },
      "betak-developments": {
        title: "Betak: real-estate offers, made immediate",
        alt: "Betak Developments campaign design showing a commercial development",
        sector: "Real estate · Property development",
        summary:
          "Campaign visuals for residential and commercial developments that put the offer, the location, and the contact line at the centre of the frame.",
        brief:
          "In a crowded property market, Betak needed to communicate unit size, instalments, and down payment quickly while keeping the development itself visually dominant.",
        approach:
          "Strong architectural imagery carries each design, with a high-contrast information layer built from large numbers, a clear location line, and the Betak identity repeated at every touchpoint.",
        deliverables: [
          "Real-estate social campaign designs",
          "Architectural image treatment",
          "Reusable property-ad templates",
        ],
        galleryAlt: [
          "Betak Developments handover campaign with a key handover scene",
          "Betak residential building offer with unit size and instalment figures",
          "Betak Developments building campaign with the same offer panel",
        ],
      },
      "compass-academy": {
        title: "Compass Academy: learning made visual",
        alt: "International Compass Academy educational design explaining the HR cycle",
        sector: "Education · Corporate training",
        summary:
          "An educational content series that turns HR systems, management skills, and prioritisation frameworks into clear, shareable visual explainers.",
        brief:
          "The academy needed to introduce management and HR concepts to a professional audience without jargon — one idea per design, easy to understand and save.",
        approach:
          "Simple diagrams, a fixed blue-and-orange palette, and a consistent title-and-icon system turn each post into part of one recognisable learning library.",
        deliverables: [
          "Educational social designs",
          "Icon and diagram system",
          "Consistent social media templates",
        ],
        galleryAlt: [
          "Compass Academy design explaining five skills of a successful manager",
          "Compass Academy design explaining the Eisenhower prioritisation matrix",
        ],
      },
      "leen-olives": {
        title: "Leen Olives: packaging that carries the premium",
        alt: "Leen Olives extra virgin olive oil bottle and label design",
        sector: "Food & beverage · Packaging & identity",
        summary:
          "A complete packaging system for extra virgin olive oil, balancing quiet premium cues with legible nutrition and origin information.",
        brief:
          "An Egyptian olive-oil brand needed shelf presence that felt premium without sacrificing the clarity of product details, sourcing, and usage instructions.",
        approach:
          "Deep green, restrained gold, and a calm typographic hierarchy let the olive mark lead. Generous information zones keep the back label readable rather than crowded.",
        deliverables: [
          "Bottle label design",
          "Product mockup presentation",
          "Packaging colour and type system",
        ],
        galleryAlt: [
          "Leen Olives label artwork showing the front and back panels",
        ],
      },
      "dr-alaa-baza": {
        title: "Dr. Alaa Baza: mental health, without the distance",
        alt: "Dr. Alaa Baza mental-health awareness design addressing social anxiety",
        sector: "Mental health · Clinics",
        summary:
          "An awareness campaign around social anxiety and post-traumatic stress, using human imagery and direct language with a clear path to booking.",
        brief:
          "The challenge was to explain sensitive psychological topics without alarm or stigma, and to connect everyday pain with the idea of asking for help.",
        approach:
          "Close human portraits, a direct headline, and calm blue fields carry the message. Clinic details and booking times close every design so the next step is never ambiguous.",
        deliverables: [
          "Mental-health awareness designs",
          "Plain-language campaign copy",
          "Booking and contact templates",
        ],
        galleryAlt: [
          "Dr. Alaa Baza design about post-traumatic stress with a thought bubble",
        ],
      },
      "dr-bass-dental": {
        title: "Dr. Bass Dental: an offer that invites the booking",
        alt: "Dr. Bass Dental Center limited-time treatment offer design",
        sector: "Dental care · Clinics",
        summary:
          "A limited-time treatment campaign that makes the price comparison immediate and keeps the clinic's contact details within reach.",
        brief:
          "The clinic needed a fast promotional piece covering check-ups, cosmetic work, and root canal treatment, with clear before-and-after pricing and no visual clutter.",
        approach:
          "Three service cards, each with its own colour, icon, and price, balance 3D dental visuals with a warm, approachable palette and one clear call to action.",
        deliverables: [
          "Promotional offer design",
          "Service and pricing layout",
          "Social media adaptation",
        ],
      },
      "frida-malaysia": {
        title: "Frida: the whole usage story in one frame",
        alt: "Frida air freshener design showing the bottles and a visual usage guide",
        sector: "Home care · Malaysia",
        summary:
          "A product visual that pairs the bottle range with an illustrated usage guide covering ten ways to apply the fragrance around the home.",
        brief:
          "Frida needed a quick introduction to its multi-use products for the Malaysian market, so shoppers could understand where and how to use them at a glance.",
        approach:
          "A soft sky backdrop, two clear product heroes, and an icon-led usage table make the range feel fresh and practical without a wall of copy.",
        deliverables: [
          "Usage-guide product design",
          "Product composition and retouching",
          "Digital advertising adaptation",
        ],
      },
      "awlad-madkour": {
        title: "Awlad Madkour: a local meat campaign with appetite",
        alt: "Awlad Madkour butcher campaign design with a shopping cart full of meat",
        sector: "Food retail · Butchery",
        summary:
          "A direct, characterful campaign that links online ordering with the shop's fresh local meat, using the brand's red identity and branch details.",
        brief:
          "The shop needed a message that combined its local, trusted character with the ease of ordering through Facebook and WhatsApp during a competitive season.",
        approach:
          "A bold product image inside a shopping cart, a large colloquial headline, and a fixed branch strip give the design instant appetite and a clear next step.",
        deliverables: [
          "Social media campaign design",
          "Colloquial advertising copy",
          "Branch information layout",
        ],
      },
      "desert-notes": {
        title: "Desert Notes",
        alt: "A warm, sculptural fragrance concept in desert-inspired tones",
        summary: "A sensory identity concept shaped by warm light, botanical forms, and a quiet sense of place.",
        brief: "Imagine a contemporary fragrance house inspired by the contrast between open desert landscapes and intimate evening rituals.",
        approach: "We paired tactile, dark packaging with sun-washed colors and restrained typography to create an identity that feels grounded yet elevated.",
        deliverables: ["Brand direction", "Packaging concept", "Campaign art direction"],
      },
      "skin-simply": {
        title: "Skin, simply",
        alt: "A minimal skincare concept set with soft pastel forms and botanical details",
        summary: "A calm visual language for a modern skincare line, centered on simple routines and thoughtful ingredients.",
        brief: "The concept explores how a young skincare label could make daily care feel clear, approachable, and considered.",
        approach: "Soft material cues, gentle color, and uncluttered compositions make the product family feel cohesive without losing its warmth.",
        deliverables: ["Visual identity direction", "Product packaging concept", "Studio imagery"],
      },
      "color-in-motion": {
        title: "Color in motion",
        alt: "Flowing blue, turquoise, and amber forms for a motion-led campaign concept",
        summary: "A flexible campaign world where fluid shapes and bold color bring a digital-first story to life.",
        brief: "This social campaign concept needed a visual system that could feel energetic across formats while remaining instantly recognizable.",
        approach: "Layered gradients, expressive curves, and a small set of repeatable graphic gestures create a playful, adaptable visual rhythm.",
        deliverables: ["Campaign art direction", "Social templates", "Motion design direction"],
      },
      "fresh-perspective": {
        title: "A fresh perspective",
        alt: "A contemporary digital product concept shown across a clean dashboard interface",
        summary: "A digital experience concept that turns a complex toolkit into a clearer, more welcoming workspace.",
        brief: "We imagined a small creative platform that helps teams bring scattered project details into one useful view.",
        approach: "A calm interface, clear hierarchy, and warm accent colors make the imagined product feel focused without feeling technical.",
        deliverables: ["Digital product direction", "Interface concept", "Responsive web design"],
      },
    } as Record<string, ProjectCopy>,
  },

  contact: {
    eyebrow: "Have a good one in mind?",
    lines: ["Let’s make", "something matter."],
    linesAria: "Let’s make something matter",
    description: "Tell us where you want to go. We’ll help you find the way.",
    emailNote: "Email details to be added",
    whatsappCta: "Chat on WhatsApp",
    whatsappAria: "Chat with Reach Agency on WhatsApp",
    phoneLabel: "WhatsApp",
    addressLabel: "Address",
    address: "Egypt, Sadat City",
    form: {
      nameLabel: "Your name",
      namePlaceholder: "Name",
      emailLabel: "Email address",
      submit: "Send an enquiry",
      messageLabel: "A little about your project",
      messagePlaceholder: "What would you like to make happen?",
      /** %name% is interpolated client-side (functions can't cross the
       *  server → client props boundary). */
      mailtoSubjectTemplate: "Project enquiry from %name%",
      /** %name% / %email% / %message% are interpolated client-side. */
      mailtoBodyTemplate: "Name: %name%\nEmail: %email%\n\n%message%",
    },
    emptyEmailNote:
      "Add your approved business email in src/data/brand.ts before publishing the contact form.",
  },

  footer: {
    tagline: "Ideas that reach further.",
    aboutHeading: "Reach Agency",
    navHeading: "Site",
    servicesHeading: "Services",
    contactHeading: "Contact",
    navAria: "Footer navigation",
    servicesNote: "All our services start from here",
    copyright: "© %year% Reach Agency · Independent creative studio",
    credit: "Developed by Ahmed Elhenawy",
  },

  notFound: {
    title: "Page not found",
    body: "The page you are looking for does not exist or has moved.",
    home: "Back to home",
  },
};

export type Dictionary = typeof en;

export default en;
