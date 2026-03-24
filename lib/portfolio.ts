export interface PortfolioCompany {
  id: string;
  name: string;
  sector: "Infrastructure" | "Software" | "Fintech" | "Consumer";
  status: "active" | "exited" | "public";
  region: "Europe" | "US" | "Brazil" | "Asia" | "LatAm" | "Global";
  searchTerms: string[];
  competitors: string[];
  website?: string;
}

export const PORTFOLIO_COMPANIES: PortfolioCompany[] = [
  {
    id: "mistral-ai",
    name: "Mistral AI",
    sector: "Infrastructure",
    status: "active",
    region: "Europe",
    searchTerms: ["Mistral AI", "Mistral", "mistral.ai"],
    competitors: ["OpenAI", "Anthropic", "Cohere", "Meta AI", "Google DeepMind"],
    website: "https://mistral.ai",
  },
  {
    id: "bitwarden",
    name: "Bitwarden",
    sector: "Software",
    status: "active",
    region: "US",
    searchTerms: ["Bitwarden"],
    competitors: ["1Password", "LastPass", "Dashlane", "NordPass"],
    website: "https://bitwarden.com",
  },
  {
    id: "creditas",
    name: "Creditas",
    sector: "Fintech",
    status: "active",
    region: "Brazil",
    searchTerms: ["Creditas"],
    competitors: ["Nubank", "PicPay", "Inter"],
    website: "https://creditas.com",
  },
  {
    id: "raisin",
    name: "Raisin",
    sector: "Fintech",
    status: "active",
    region: "Europe",
    searchTerms: ["Raisin", "Raisin DS", "raisin.com"],
    competitors: ["Deposit Solutions", "WeltSparen", "SaveBetter"],
    website: "https://raisin.com",
  },
  {
    id: "gopuff",
    name: "Gopuff",
    sector: "Consumer",
    status: "active",
    region: "US",
    searchTerms: ["Gopuff"],
    competitors: ["DoorDash", "Instacart", "Gorillas", "Getir"],
    website: "https://gopuff.com",
  },
  {
    id: "semrush",
    name: "SEMrush",
    sector: "Software",
    status: "public",
    region: "US",
    searchTerms: ["SEMrush", "SEMR"],
    competitors: ["Ahrefs", "Moz", "SpyFu", "Similarweb"],
    website: "https://semrush.com",
  },
  {
    id: "fetch",
    name: "Fetch",
    sector: "Consumer",
    status: "active",
    region: "US",
    searchTerms: ["Fetch Rewards", "Fetch app"],
    competitors: ["Ibotta", "Shopkick", "Checkout51"],
    website: "https://fetch.com",
  },
  {
    id: "nivoda",
    name: "Nivoda",
    sector: "Software",
    status: "active",
    region: "Europe",
    searchTerms: ["Nivoda"],
    competitors: ["VDB", "RapNet", "Polygon.io diamonds"],
    website: "https://nivoda.net",
  },
  {
    id: "honeycomb",
    name: "Honeycomb",
    sector: "Infrastructure",
    status: "active",
    region: "US",
    searchTerms: ["Honeycomb.io", "Honeycomb observability"],
    competitors: ["Datadog", "New Relic", "Splunk", "Grafana"],
    website: "https://honeycomb.io",
  },
  {
    id: "staffbase",
    name: "Staffbase",
    sector: "Software",
    status: "active",
    region: "Europe",
    searchTerms: ["Staffbase"],
    competitors: ["Workvivo", "Simpplr", "Firstup"],
    website: "https://staffbase.com",
  },
  {
    id: "brite-payments",
    name: "Brite Payments",
    sector: "Fintech",
    status: "active",
    region: "Europe",
    searchTerms: ["Brite Payments"],
    competitors: ["Trustly", "Klarna", "Stripe"],
    website: "https://britepayments.com",
  },
  {
    id: "natural-cycles",
    name: "Natural Cycles",
    sector: "Consumer",
    status: "active",
    region: "Europe",
    searchTerms: ["Natural Cycles"],
    competitors: ["Flo", "Clue", "Ovia"],
    website: "https://naturalcycles.com",
  },
  {
    id: "housecall-pro",
    name: "Housecall Pro",
    sector: "Software",
    status: "active",
    region: "US",
    searchTerms: ["Housecall Pro"],
    competitors: ["ServiceTitan", "Jobber"],
    website: "https://housecallpro.com",
  },
  {
    id: "bumble",
    name: "Bumble",
    sector: "Consumer",
    status: "public",
    region: "US",
    searchTerms: ["Bumble", "BMBL"],
    competitors: ["Tinder", "Match Group", "Hinge", "Grindr"],
    website: "https://bumble.com",
  },
  {
    id: "acorns",
    name: "Acorns",
    sector: "Fintech",
    status: "active",
    region: "US",
    searchTerms: ["Acorns", "Acorns investing"],
    competitors: ["Robinhood", "Stash", "Betterment", "Wealthfront"],
    website: "https://acorns.com",
  },
  {
    id: "finom",
    name: "Finom",
    sector: "Fintech",
    status: "active",
    region: "Europe",
    searchTerms: ["Finom"],
    competitors: ["Qonto", "Penta", "Holvi"],
    website: "https://finom.co",
  },
  {
    id: "heidi-health",
    name: "Heidi Health",
    sector: "Software",
    status: "active",
    region: "Global",
    searchTerms: ["Heidi Health"],
    competitors: ["Nuance DAX", "Ambience Healthcare", "Abridge"],
    website: "https://heidihealth.com",
  },
  {
    id: "owner",
    name: "Owner",
    sector: "Software",
    status: "active",
    region: "US",
    searchTerms: ["Owner.com", "Owner restaurant"],
    competitors: ["Toast", "Square", "ChowNow"],
    website: "https://owner.com",
  },
  {
    id: "sorare",
    name: "Sorare",
    sector: "Consumer",
    status: "active",
    region: "Europe",
    searchTerms: ["Sorare"],
    competitors: ["DraftKings", "FanDuel", "Dapper Labs"],
    website: "https://sorare.com",
  },
  {
    id: "buk",
    name: "Buk",
    sector: "Software",
    status: "active",
    region: "LatAm",
    searchTerms: ["Buk HR", "Buk software"],
    competitors: ["Gusto", "Deel", "Factorial"],
    website: "https://buk.cl",
  },
  {
    id: "olist",
    name: "Olist",
    sector: "Consumer",
    status: "active",
    region: "Brazil",
    searchTerms: ["Olist"],
    competitors: ["Mercado Libre", "VTEX", "Nuvemshop"],
    website: "https://olist.com",
  },
  {
    id: "plancraft",
    name: "Plancraft",
    sector: "Software",
    status: "active",
    region: "Europe",
    searchTerms: ["Plancraft"],
    competitors: ["Procore", "Buildertrend", "CoConstruct"],
    website: "https://plancraft.de",
  },
  {
    id: "podimo",
    name: "Podimo",
    sector: "Consumer",
    status: "active",
    region: "Europe",
    searchTerms: ["Podimo"],
    competitors: ["Spotify", "Apple Podcasts", "Audible"],
    website: "https://podimo.com",
  },
  {
    id: "air",
    name: "Air",
    sector: "Software",
    status: "active",
    region: "US",
    searchTerms: ["Air.inc", "Air creative ops"],
    competitors: ["Brandfolder", "Bynder", "Frontify"],
    website: "https://air.inc",
  },
  {
    id: "motion",
    name: "Motion",
    sector: "Software",
    status: "active",
    region: "US",
    searchTerms: ["Motion app", "usemotion.com"],
    competitors: ["Asana", "Monday.com", "Notion Calendar"],
    website: "https://usemotion.com",
  },
  {
    id: "farfetch",
    name: "Farfetch",
    sector: "Consumer",
    status: "public",
    region: "Europe",
    searchTerms: ["Farfetch", "FTCH"],
    competitors: ["Net-a-Porter", "SSENSE", "Mytheresa"],
    website: "https://farfetch.com",
  },
  {
    id: "sonos",
    name: "Sonos",
    sector: "Consumer",
    status: "public",
    region: "US",
    searchTerms: ["Sonos", "SONO"],
    competitors: ["Bose", "Apple HomePod", "Amazon Echo"],
    website: "https://sonos.com",
  },
  {
    id: "the-realreal",
    name: "The RealReal",
    sector: "Consumer",
    status: "public",
    region: "US",
    searchTerms: ["The RealReal", "REAL stock", "TheRealReal"],
    competitors: ["Vestiaire Collective", "Poshmark", "ThredUp"],
    website: "https://therealreal.com",
  },
  {
    id: "pismo",
    name: "Pismo",
    sector: "Fintech",
    status: "exited",
    region: "Brazil",
    searchTerms: ["Pismo", "Pismo Visa"],
    competitors: ["Marqeta", "Galileo", "i2c"],
    website: "https://pismo.io",
  },
  {
    id: "segment",
    name: "Segment",
    sector: "Software",
    status: "exited",
    region: "US",
    searchTerms: ["Segment Twilio", "Twilio Segment"],
    competitors: ["mParticle", "Rudderstack", "Amplitude"],
    website: "https://segment.com",
  },
  {
    id: "black-forest-labs",
    name: "Black Forest Labs",
    sector: "Infrastructure",
    status: "active",
    region: "Europe",
    searchTerms: ["Black Forest Labs", "FLUX model", "BFL"],
    competitors: ["Stability AI", "Midjourney", "DALL-E"],
    website: "https://blackforestlabs.ai",
  },
  {
    id: "deepip",
    name: "DeepIP",
    sector: "Software",
    status: "active",
    region: "Europe",
    searchTerms: ["DeepIP"],
    competitors: ["PatSnap", "Anaqua", "CPA Global"],
    website: "https://deepip.com",
  },
  {
    id: "procure-ai",
    name: "Procure AI",
    sector: "Software",
    status: "active",
    region: "US",
    searchTerms: ["Procure AI", "ProcureAI"],
    competitors: ["Coupa", "Jaggaer", "SAP Ariba"],
  },
  {
    id: "thread",
    name: "Thread",
    sector: "Software",
    status: "active",
    region: "US",
    searchTerms: ["Thread"],
    competitors: [],
  },
  {
    id: "gruns",
    name: "Grüns",
    sector: "Consumer",
    status: "active",
    region: "US",
    searchTerms: ["Grüns", "Gruns", "Grüns greens"],
    competitors: ["AG1", "Huel", "Ka'Chava"],
    website: "https://gruns.com",
  },
];

// Helpers

export function getPortfolioCompany(id: string): PortfolioCompany | undefined {
  return PORTFOLIO_COMPANIES.find((c) => c.id === id);
}

export function getPortfolioCompaniesBySector(sector: string): PortfolioCompany[] {
  return PORTFOLIO_COMPANIES.filter((c) => c.sector === sector);
}

export function getAllCompetitors(): string[] {
  const set = new Set<string>();
  for (const c of PORTFOLIO_COMPANIES) {
    for (const comp of c.competitors) {
      set.add(comp);
    }
  }
  return [...set];
}

/** Find which portfolio company a competitor name relates to */
export function findAffectedPortfolioCompany(competitorName: string): PortfolioCompany | undefined {
  const lower = competitorName.toLowerCase();
  return PORTFOLIO_COMPANIES.find((c) =>
    c.competitors.some((comp) => comp.toLowerCase() === lower)
  );
}

/** Check if a headline/text mentions any portfolio company, return matches */
export function matchPortfolioCompanies(text: string): PortfolioCompany[] {
  const lower = text.toLowerCase();
  return PORTFOLIO_COMPANIES.filter((c) =>
    c.searchTerms.some((term) => lower.includes(term.toLowerCase()))
  );
}

/** Check if a headline/text mentions any competitor, return the competitor name + affected company */
export function matchCompetitors(text: string): Array<{ competitor: string; affectedCompany: PortfolioCompany }> {
  const lower = text.toLowerCase();
  const matches: Array<{ competitor: string; affectedCompany: PortfolioCompany }> = [];
  for (const company of PORTFOLIO_COMPANIES) {
    for (const comp of company.competitors) {
      if (lower.includes(comp.toLowerCase())) {
        matches.push({ competitor: comp, affectedCompany: company });
      }
    }
  }
  return matches;
}
