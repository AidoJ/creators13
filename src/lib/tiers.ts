export const TIERS = {
  wren: {
    name: "Wren",
    subtitle: "Explorer",
    monthlyPrice: 0,
    annualPrice: 0,
    stripe: null, // Free tier
    features: [
      "Access community features",
      "Creator Type overview",
      "Basic profile",
      "Browse public content",
    ],
  },
  robin: {
    name: "Robin",
    subtitle: "Seeker",
    monthlyPrice: 29,
    annualPrice: 290,
    stripe: {
      product_id: "prod_TxQSqM8GK6jwTW",
      price_id: "price_1SzVbNKn3GaB6FyYoO6MkGVP",
    },
    features: [
      "Everything in Wren",
      "Full Creator Type profiling",
      "8-photo analysis",
      "1-on-1 Zoom session",
      "Personal dashboard",
    ],
  },
  falcon: {
    name: "Falcon",
    subtitle: "Achiever",
    monthlyPrice: 59,
    annualPrice: 590,
    stripe: {
      product_id: "prod_TxQStGJfHnAXQW",
      price_id: "price_1SzVbgKn3GaB6FyYCfUgBra7",
    },
    features: [
      "Everything in Robin",
      "Ongoing coaching sessions",
      "Advanced profiling insights",
      "Priority booking",
      "Training resources",
    ],
  },
  owl: {
    name: "Owl",
    subtitle: "Practitioner Training",
    monthlyPrice: 149,
    annualPrice: 1490,
    stripe: {
      product_id: "prod_TxQSXgaIwOlytz",
      price_id: "price_1SzVbuKn3GaB6FyYK79PeTVa",
    },
    features: [
      "Everything in Falcon",
      "Full LMS access",
      "Practitioner certification path",
      "Case study creation",
      "Client management tools",
      "Assessment & evaluation",
    ],
  },
} as const;

export type TierKey = keyof typeof TIERS;
