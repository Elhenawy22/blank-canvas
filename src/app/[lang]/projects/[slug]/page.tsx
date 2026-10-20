import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectPage from "@/components/project-page";
import { getProject, projectPath, projects } from "@/data/portfolio";
import { isLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

type Params = { params: Promise<{ lang: string; slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};

  const project = getProject(slug);
  if (!project) return {};

  const dictionary = getDictionary(lang);
  const copy = dictionary.work.projects[project.slug];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const pathname = `${lang === "en" ? "" : localePath(lang)}${projectPath(project.slug)}`;

  return {
    title: copy.title,
    description: copy.summary,
    ...(siteUrl
      ? {
          alternates: {
            canonical: pathname,
            languages: {
              en: projectPath(project.slug),
              ar: `/ar${projectPath(project.slug)}`,
              "x-default": projectPath(project.slug),
            },
          },
          openGraph: {
            title: copy.title,
            description: copy.summary,
            type: "article",
            images: [project.image],
          },
        }
      : {}),
  };
}

export default async function LocalizedProjectPage({ params }: Params) {
  const { lang, slug } = await params;
  if (!isLocale(lang) || !getProject(slug)) notFound();

  return <ProjectPage locale={lang} slug={slug} />;
}
