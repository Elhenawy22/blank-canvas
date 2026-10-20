/**
 * Portfolio structure shared by every locale: stable ids, image paths and
 * grid placement. Display strings (titles, labels, alt text) live in the
 * i18n dictionaries and are matched by `slug` / `id`.
 */

export type CategoryId = "all" | "branding" | "social" | "dev" | "photo" | "video";

export const categoryIds: Exclude<CategoryId, "all">[] = [
  "branding",
  "social",
  "dev",
  "photo",
  "video",
];

export type ProjectKind = "client" | "concept";

export type Project = {
  slug: string;
  /** Grid presentation — localized type stays "wide" aware via className. */
  image: string;
  /** Kept for the concept pages that still use a single secondary visual. */
  secondaryImage: string;
  /** Additional project visuals (the cover is `image`). */
  gallery: string[];
  categoryId: Exclude<CategoryId, "all">;
  kind: ProjectKind;
  className: string;
  /** Real client name — brand names stay untranslated across locales. */
  client?: string;
};

export const projects: Project[] = [
  {
    slug: "greens",
    image: "/images/work/greens/01.jpg",
    secondaryImage: "/images/work/greens/02.jpg",
    gallery: [
      "/images/work/greens/02.jpg",
      "/images/work/greens/03.jpg",
      "/images/work/greens/04.jpg",
      "/images/work/greens/05.jpg",
      "/images/work/greens/06.jpg",
      "/images/work/greens/07.jpg",
    ],
    categoryId: "social",
    kind: "client",
    className: "project-card--portrait",
    client: "Greens for Agriculture Development",
  },
  {
    slug: "betak-developments",
    image: "/images/work/betak-developments/01.jpg",
    secondaryImage: "/images/work/betak-developments/02.jpg",
    gallery: [
      "/images/work/betak-developments/02.jpg",
      "/images/work/betak-developments/03.jpg",
      "/images/work/betak-developments/04.jpg",
    ],
    categoryId: "social",
    kind: "client",
    className: "project-card--portrait",
    client: "Betak Developments",
  },
  {
    slug: "compass-academy",
    image: "/images/work/compass-academy/01.jpg",
    secondaryImage: "/images/work/compass-academy/02.jpg",
    gallery: [
      "/images/work/compass-academy/02.jpg",
      "/images/work/compass-academy/03.jpg",
    ],
    categoryId: "social",
    kind: "client",
    className: "project-card--portrait",
    client: "International Compass Academy",
  },
  {
    slug: "leen-olives",
    image: "/images/work/leen-olives/01.jpg",
    secondaryImage: "/images/work/leen-olives/02.jpg",
    gallery: ["/images/work/leen-olives/02.jpg"],
    categoryId: "branding",
    kind: "client",
    className: "project-card--portrait",
    client: "Leen Olives",
  },
  {
    slug: "dr-alaa-baza",
    image: "/images/work/dr-alaa-baza/01.jpg",
    secondaryImage: "/images/work/dr-alaa-baza/02.jpg",
    gallery: ["/images/work/dr-alaa-baza/02.jpg"],
    categoryId: "social",
    kind: "client",
    className: "project-card--portrait",
    client: "Dr. Alaa Baza",
  },
  {
    slug: "dr-bass-dental",
    image: "/images/work/dr-bass-dental/01.jpg",
    secondaryImage: "/images/work/dr-bass-dental/01.jpg",
    gallery: [],
    categoryId: "social",
    kind: "client",
    className: "project-card--portrait",
    client: "Dr. Bass Dental Center",
  },
  {
    slug: "frida-malaysia",
    image: "/images/work/frida-malaysia/01.jpg",
    secondaryImage: "/images/work/frida-malaysia/01.jpg",
    gallery: [],
    categoryId: "photo",
    kind: "client",
    className: "project-card--portrait",
    client: "Frida Aqua Sensations",
  },
  {
    slug: "awlad-madkour",
    image: "/images/work/awlad-madkour/01.jpg",
    secondaryImage: "/images/work/awlad-madkour/01.jpg",
    gallery: [],
    categoryId: "social",
    kind: "client",
    className: "project-card--portrait",
    client: "Awlad Madkour",
  },
];

export const categoryOrder: CategoryId[] = ["all", ...categoryIds];

export function projectPath(slug: string): string {
  return `/projects/${slug}`;
}

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
