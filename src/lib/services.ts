export type ServiceTier = {
  name: string;
  price: string;
  priceValue: number;
};

/** Sharing per service: Owner % and Part-timer % (each 0–100, sum = 100). Used for Transaction History. */
export const SHARING_PER_SERVICE: Record<string, { ownerPct: number; parttimerPct: number }> = {
  "Statistical Analysis": { ownerPct: 40, parttimerPct: 60 },
  "Research": { ownerPct: 40, parttimerPct: 60 },
  "Turnitin Check": { ownerPct: 50, parttimerPct: 50 },
  "Paraphrasing": { ownerPct: 50, parttimerPct: 50 },
  "Validation of Instrument": { ownerPct: 40, parttimerPct: 60 },
  "Editing": { ownerPct: 30, parttimerPct: 70 },
};

/** Get price (amount to pay) for an order from the selected service and tier. */
export function getAmountFromService(serviceType: string, pricingTier: string): number {
  const service = SERVICES.find((s) => s.name === serviceType);
  if (!service) return 0;
  const tier = service.tiers.find((t) => t.name === pricingTier) ?? service.tiers[0];
  return tier?.priceValue ?? 0;
}

export type ServiceDefinition = {
  id: string;
  name: string;
  description: string;
  screeningQuestion?: string;
  tiers: ServiceTier[];
  hasChapterCount?: boolean;
  hasWordCount?: boolean;
};

export const SERVICES: ServiceDefinition[] = [
  {
    id: "statistical-analysis",
    name: "Statistical Analysis",
    description: "Professional statistical analysis including descriptive statistics, inferential analysis, and multivariate methods.",
    screeningQuestion: "Are you willing to pay for this rate?",
    tiers: [
      { name: "Basic (Descriptive Statistics)", price: "₱1,500", priceValue: 1500 },
      { name: "Moderate (Inferential - Basic Comparison & Relationship)", price: "₱2,500", priceValue: 2500 },
      { name: "Advanced (Multivariate & Predictive Analysis)", price: "₱4,000", priceValue: 4000 },
    ],
  },
  {
    id: "validation-of-instrument",
    name: "Validation of Instrument",
    description: "Validation of research instruments including reliability and validity analysis. Requires Chapter 1-3, questionnaire, and data file in Excel.",
    tiers: [{ name: "Standard", price: "₱200", priceValue: 200 }],
  },
  {
    id: "research",
    name: "Research",
    description: "Comprehensive research assistance including proposal writing, literature review, methodology, and full project support.",
    tiers: [{ name: "Open Quotation", price: "Based on agreement (chat)", priceValue: 0 }],
    hasChapterCount: true,
  },
  {
    id: "turnitin-check",
    name: "Turnitin Check",
    description: "Plagiarism checking service using Turnitin to ensure academic integrity of your work.",
    tiers: [{ name: "Standard Check", price: "₱500", priceValue: 500 }],
  },
  {
    id: "paraphrasing",
    name: "Paraphrasing",
    description: "Expert paraphrasing to improve originality and academic quality of your documents.",
    tiers: [{ name: "Per page", price: "₱20 per page", priceValue: 20 }],
    hasWordCount: true,
  },
  {
    id: "editing",
    name: "Editing",
    description: "Professional editing and proofreading to polish your academic and professional documents.",
    tiers: [{ name: "Standard", price: "₱1,500", priceValue: 1500 }],
    hasWordCount: true,
  },
];
