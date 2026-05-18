export const PLANS = [
  {
    id: import.meta.env.VITE_FREE_PLAN_ID || "",
    planName: "Free",
    duration: 0,
    price: 0,
    description: "Basic access for testing and exploration",
    featured: false,
  },
  {
    id: import.meta.env.VITE_SILVER_PLAN_ID || "",
    planName: "Silver",
    duration: 30,
    price: 499,
    description: "Best for regular users",
    featured: false,
  },
  {
    id: import.meta.env.VITE_GOLD_PLAN_ID || "",
    planName: "Gold",
    duration: 90,
    price: 999,
    description: "Best value for long-term access",
    featured: true,
  },
];
