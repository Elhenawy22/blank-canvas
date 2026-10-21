import Image from "next/image";
import { ArrowIcon } from "@/components/icons";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/footer";
import SiteHeader from "@/components/header";
import SmoothScroll from "@/components/smooth-scroll";
import WhatsAppFab from "@/components/whatsapp-fab";
import { getProject, projectPath, projects } from "@/data/portfolio";
import type { Locale } from "@/i18n/config";
import { localePath, localizedPath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default function ProjectPage({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  const dictionary = getDictionary(locale);
  const project = getProject(slug);
  if (!project) notFound();

  const copy = dictionary.work.projects[project.slug];
  const pageCopy = dictionary.work.projectPage;
  const isClient = project.kind === "client";
  const gallery = isClient ? project.gallery : [project.secondaryImage];
  const pageTag = isClient ? pageCopy.clientLabel : pageCopy.conceptLabel;
  const imageCaption = isClient ? pageCopy.clientImageCaption : pageCopy.imageCaption;
  const deliverablesHeading = isClient
    ? pageCopy.deliverablesHeading
    : pageCopy.conceptDeliverablesHeading;
  const currentIndex = projects.findIndex((item) => item.slug === project.slug);
  const nextProject = projects[(currentIndex + 1) % projects.length];
  const nextCopy = dictionary.work.projects[nextProject.slug];
  const homeHref = localePath(locale);

  return (
    <>
      <SmoothScroll />
      <a className="skip-link" href="#main-content">
        {dictionary.nav.skipToContent}
      </a>
      <SiteHeader dictionary={dictionary} locale={locale} subpath={projectPath(project.slug)} />
      <main className="project-page" id="main-content">
        <section className="project-hero">
          <div className="project-hero__intro">
            <a className="project-back" href={`${homeHref}#work`}>
              <ArrowIcon />
              {pageCopy.backToWork}
            </a>
            <p className="eyebrow">{dictionary.work.categories[project.categoryId]}</p>
            <h1>{copy.title}</h1>
            <p className="project-hero__summary">{copy.summary}</p>
            {isClient && (project.client || copy.sector) ? (
              <dl className="project-meta">
                {project.client ? (
                  <div>
                    <dt>{pageCopy.clientMetaLabel}</dt>
                    <dd>{project.client}</dd>
                  </div>
                ) : null}
                {copy.sector ? (
                  <div>
                    <dt>{pageCopy.sectorLabel}</dt>
                    <dd>{copy.sector}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
            <span className="project-concept-tag">{pageTag}</span>
          </div>
          <figure className={`project-hero__visual${isClient ? " project-hero__visual--client" : ""}`}>
            <Image
              alt={copy.alt}
              fill
              priority
              sizes="(max-width: 700px) 100vw, 88vw"
              src={project.image}
            />
            <figcaption>{imageCaption}</figcaption>
          </figure>
        </section>

        <section className="project-story section">
          <div className="project-story__lead">
            <p className="eyebrow">{pageCopy.overviewHeading}</p>
            <h2>{copy.brief}</h2>
          </div>
          <div className="project-story__approach">
            <p className="eyebrow">{pageCopy.approachHeading}</p>
            <p>{copy.approach}</p>
            <h3>{deliverablesHeading}</h3>
            <ul>
              {copy.deliverables.map((deliverable) => (
                <li key={deliverable}>{deliverable}</li>
              ))}
            </ul>
          </div>
        </section>

        {gallery.length > 0 ? (
          <section className="project-gallery-section section">
            <p className="eyebrow">{pageCopy.galleryHeading}</p>
            <div className="project-gallery-grid">
              {gallery.map((src, index) => (
                <figure className="project-gallery-grid__item" key={src}>
                  <Image
                    alt={copy.galleryAlt?.[index] ?? ""}
                    fill
                    sizes="(max-width: 700px) 92vw, 45vw"
                    src={src}
                  />
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <section className="project-next section">
          <p className="eyebrow">{pageCopy.nextProject}</p>
          <a
            className="project-next__link"
            href={localizedPath(locale, projectPath(nextProject.slug))}
          >
            <span>{nextCopy.title}</span>
            <ArrowIcon />
          </a>
          <div className="project-next__contact">
            <p>{pageCopy.contactCta}</p>
            <a className="button button--dark" href={`${homeHref}#contact`}>
              {pageCopy.contactLink} <ArrowIcon />
            </a>
          </div>
        </section>
      </main>
      <SiteFooter dictionary={dictionary} locale={locale} subpath={projectPath(project.slug)} />
      <WhatsAppFab label={dictionary.contact.whatsappAria} />
    </>
  );
}
