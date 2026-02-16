export type ServiceTier = {
  name: string;
  price: string;
  priceValue: number;
};

export type ServiceDefinition = {
  id: string;
  name: string;
  description: string;
  tiers: ServiceTier[];
  hasChapterCount?: boolean;
  hasWordCount?: boolean;
};

export const SERVICES: ServiceDefinition[] = [
  {
    id: "statistical-analysis",
    name: "Statistical Analysis",
    description: "Professional statistical analysis including descriptive statistics, ANOVA, regression, t-tests, and correlation analysis.",
    tiers: [
      { name: "Descriptive Statistics", price: "KSh 1,500", priceValue: 1500 },
      { name: "ANOVA / Regression / t-test / Correlation", price: "KSh 3,000", priceValue: 3000 },
    ],
  },
  {
    id: "research",
    name: "Research",
    description: "Comprehensive research assistance including proposal writing, literature review, methodology, and full project support.",
    tiers: [{ name: "Custom Quote", price: "Pricing TBD", priceValue: 0 }],
    hasChapterCount: true,
  },
  {
    id: "turnitin-check",
    name: "Turnitin Check",
    description: "Plagiarism checking service using Turnitin to ensure academic integrity of your work.",
    tiers: [{ name: "Standard Check", price: "Pricing TBD", priceValue: 0 }],
  },
  {
    id: "paraphrasing",
    name: "Paraphrasing",
    description: "Expert paraphrasing to improve originality and academic quality of your documents.",
    tiers: [{ name: "Standard", price: "Pricing TBD", priceValue: 0 }],
    hasWordCount: true,
  },
  {
    id: "editing",
    name: "Editing",
    description: "Professional editing and proofreading to polish your academic and professional documents.",
    tiers: [{ name: "Standard", price: "Pricing TBD", priceValue: 0 }],
    hasWordCount: true,
  },
];
