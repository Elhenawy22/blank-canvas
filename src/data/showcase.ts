/**
 * Service-and-outcome showcase shown on the homepage. Images, dimensions
 * and item order are shared across locales; the display copy lives in the
 * i18n dictionaries and is matched by `id`.
 */

export type ShowcaseId =
  | "brand-story"
  | "visual-identity"
  | "personal-brand"
  | "web-experience"
  | "paid-ads"
  | "digital-marketing"
  | "full-service"
  | "real-estate-strategy"
  | "dental-results"
  | "ecommerce-performance"
  | "ecommerce-revenue"
  | "real-estate-results";

export type ShowcaseItem = {
  id: ShowcaseId;
  image: string;
  width: number;
  height: number;
};

export const showcaseItems: ShowcaseItem[] = [
  {
    id: "brand-story",
    image: "/images/showcase/brand-story.jpg",
    width: 1122,
    height: 1402,
  },
  {
    id: "visual-identity",
    image: "/images/showcase/visual-identity.jpg",
    width: 1122,
    height: 1402,
  },
  {
    id: "personal-brand",
    image: "/images/showcase/personal-brand.jpg",
    width: 1122,
    height: 1402,
  },
  {
    id: "web-experience",
    image: "/images/showcase/web-experience.jpg",
    width: 1122,
    height: 1402,
  },
  {
    id: "paid-ads",
    image: "/images/showcase/paid-ads.jpg",
    width: 1122,
    height: 1402,
  },
  {
    id: "digital-marketing",
    image: "/images/showcase/digital-marketing.jpg",
    width: 1122,
    height: 1402,
  },
  {
    id: "full-service",
    image: "/images/showcase/full-service.jpg",
    width: 1122,
    height: 1402,
  },
  {
    id: "real-estate-strategy",
    image: "/images/showcase/real-estate-strategy.jpg",
    width: 1122,
    height: 1402,
  },
  {
    id: "dental-results",
    image: "/images/showcase/dental-results.jpg",
    width: 900,
    height: 1600,
  },
  {
    id: "ecommerce-performance",
    image: "/images/showcase/ecommerce-performance.jpg",
    width: 1122,
    height: 1402,
  },
  {
    id: "ecommerce-revenue",
    image: "/images/showcase/ecommerce-revenue.jpg",
    width: 1122,
    height: 1402,
  },
  {
    id: "real-estate-results",
    image: "/images/showcase/real-estate-results.jpg",
    width: 1122,
    height: 1402,
  },
];
