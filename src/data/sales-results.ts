/**
 * Client sales-result case studies shown on the homepage. Stable ids,
 * image paths and metric figures are shared across locales. Display
 * copy (titles, summaries, labels) lives in the i18n dictionaries and
 * is matched by `id`.
 */

export type SalesResultId =
  | "ecommerce-strong"
  | "ecommerce-case"
  | "mens-fashion-egypt"
  | "luxury-womens-egypt"
  | "luxury-mens-shoes-egypt"
  | "air-freshener-malaysia";

export type SalesResult = {
  id: SalesResultId;
  image: string;
  metrics: {
    sales: string;
    salesDelta?: string;
    orders: string;
    ordersDelta?: string;
    conversion: string;
    conversionDelta?: string;
    aov?: string;
    period: string;
  };
};

export const salesResults: SalesResult[] = [
  {
    id: "ecommerce-strong",
    image: "/images/results/ecommerce-strong.jpg",
    metrics: {
      sales: "E£5.9M",
      salesDelta: "+107%",
      orders: "1,749",
      ordersDelta: "+14%",
      conversion: "1%",
      period: "365",
    },
  },
  {
    id: "ecommerce-case",
    image: "/images/results/ecommerce-case.jpg",
    metrics: {
      sales: "E£4.9M",
      orders: "752",
      conversion: "0.7%",
      period: "365",
    },
  },
  {
    id: "mens-fashion-egypt",
    image: "/images/results/mens-fashion-egypt.jpg",
    metrics: {
      sales: "E£38.4M",
      salesDelta: "+88%",
      orders: "6,676",
      ordersDelta: "+29%",
      conversion: "0.6%",
      aov: "E£5,752",
      period: "365",
    },
  },
  {
    id: "luxury-womens-egypt",
    image: "/images/results/luxury-womens-egypt.jpg",
    metrics: {
      sales: "E£5.2M",
      orders: "1,059",
      conversion: "0.9%",
      period: "365",
    },
  },
  {
    id: "luxury-mens-shoes-egypt",
    image: "/images/results/luxury-mens-shoes-egypt.jpg",
    metrics: {
      sales: "E£4.9M",
      orders: "752",
      conversion: "0.7%",
      period: "365",
    },
  },
  {
    id: "air-freshener-malaysia",
    image: "/images/results/air-freshener-malaysia.jpg",
    metrics: {
      sales: "RM195,368",
      salesDelta: "+12%",
      orders: "3,793",
      ordersDelta: "+18%",
      conversion: "1.5%",
      conversionDelta: "+0.7%",
      aov: "RM51.5",
      period: "30",
    },
  },
];
