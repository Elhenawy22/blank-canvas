"use client";

import { FormEvent, type CSSProperties, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { brand, milestones } from "@/data/brand";

const services = [
  {
    title: "Digital Marketing",
    description:
      "Smart campaigns built to grow awareness and turn attention into measurable results.",
    style: "service-card--marketing",
  },
  {
    title: "Brand Identity",
    description:
      "Distinctive visual identities that capture your character and make your brand memorable.",
    style: "service-card--identity",
  },
  {
    title: "Social Media",
    description:
      "Thoughtful strategy and content that gives your brand a more meaningful presence.",
    style: "service-card--social",
  },
  {
    title: "Web Development",
    description:
      "Digital experiences that feel unmistakably yours and make every visit count.",
    style: "service-card--web",
  },
];

const categories = [
  "View All",
  "Branding",
  "Social Media",
  "Programming and Design",
  "Photography",
  "Videography",
];

const projects = [
  {
    title: "Desert Notes",
    category: "Branding",
    type: "Concept project",
    image: "/images/portfolio-perfume.jpg",
    alt: "Black fragrance bottle surrounded by vivid red flowers",
    className: "project-card--wide",
  },
  {
    title: "Skin, simply",
    category: "Photography",
    type: "Concept project",
    image: "/images/portfolio-skincare.jpg",
    alt: "Minimal skincare still life",
    className: "",
  },
  {
    title: "Color in motion",
    category: "Social Media",
    type: "Concept project",
    image: "/images/portfolio-abstract.jpg",
    alt: "Blue and turquoise abstract gradient artwork",
    className: "",
  },
  {
    title: "A fresh perspective",
    category: "Programming and Design",
    type: "Concept project",
    image: "/images/portfolio-design.jpg",
    alt: "Design workspace with a desktop monitor and studio plant",
    className: "",
  },
];

function ReachMark() {
  return (
    <svg
      aria-hidden="true"
      className="reach-mark"
      viewBox="0 0 48 48"
      fill="none"
    >
      <path
        d="M24 3.5 29.7 10l8-1.3-.7 8.1 6.8 4.9-5.5 6 2.1 7.9-8 1.1L28 43.8l-6.6-4.7-7.6 2.9-2-8-7.6-2.9 3.4-7.4-4.7-6.7 7.3-3.5.3-8.2 8.1 1.3L24 3.5Z"
        fill="currentColor"
      />
      <path
        d="M15 27.8c5-7.6 11.9-11.1 20.5-10.7-5.1 1.5-9.2 4.2-12.1 8.3 3.6-2.1 7.1-3 10.6-2.6-5.7 1.3-9.3 4.4-11 9.2-1.9-1.9-4.6-3.3-8-4.2Z"
        fill="white"
      />
    </svg>
  );
}

function BrandLogo() {
  return (
    <a className="brand" href="#home" aria-label={`${brand.name} home`}>
      <ReachMark />
      <span>REACH</span>
    </a>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path
        d="M4.25 10h11.5m-4.75-4.75L15.75 10 11 14.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <header className="site-header">
      <BrandLogo />
      <div className="header-actions">
        <a className="button button--dark header-cta" href="#contact">
          Request service
        </a>
        <button
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          className={`menu-toggle${menuOpen ? " is-open" : ""}`}
          onClick={() => setMenuOpen((open) => !open)}
          ref={menuToggleRef}
          type="button"
        >
          <span />
          <span />
        </button>
      </div>
      <nav
        aria-label="Main navigation"
        className={`navigation${menuOpen ? " navigation--open" : ""}`}
        inert={!menuOpen}
        id="main-navigation"
      >
        <a href="#home" onClick={closeMenu}>Home</a>
        <a href="#about" onClick={closeMenu}>About</a>
        <a href="#services" onClick={closeMenu}>Services</a>
        <a href="#work" onClick={closeMenu}>Our work</a>
        <a href="#contact" onClick={closeMenu}>Contact</a>
        <a className="navigation__mobile-cta" href="#contact" onClick={closeMenu}>
          Request a service <ArrowIcon />
        </a>
      </nav>
    </header>
  );
}

function HeroArtwork() {
  return (
    <div className="hero-artwork" aria-hidden="true">
      <div className="hero-artwork__glow" />
      {Array.from({ length: 9 }, (_, index) => (
        <span
          className="hero-artwork__bar"
          key={index}
          style={{ "--bar-index": index } as CSSProperties}
        />
      ))}
    </div>
  );
}

function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero__content">
        <p className="eyebrow hero__eyebrow">Independent creative studio</p>
        <h1>
          IDEAS THAT
          <br />
          REACH <span>FURTHER.</span>
        </h1>
        <p className="hero__description">
          A full-service creative and digital agency.
        </p>
        <a className="button button--dark hero__button" href="#contact">
          Request service <ArrowIcon />
        </a>
      </div>
      <div className="hero__social-note">Strategy · Creativity · Growth</div>
      <HeroArtwork />
      <a className="hero__scroll" href="#services" aria-label="Scroll to services">
        <span>Scroll to explore</span>
        <span className="hero__scroll-line" />
      </a>
    </section>
  );
}

function Services() {
  return (
    <section className="section services-section" id="services">
      <div className="section-heading section-heading--left">
        <p className="eyebrow">What we do</p>
        <h2>Empowering brands through innovative and modern solutions</h2>
        <p className="section-heading__description">
          We bring strategy, design, and digital innovation together to help
          your brand move forward with purpose.
        </p>
      </div>
      <div className="services-grid">
        {services.map((service, index) => (
          <a
            className={`service-card ${service.style}`}
            href="#contact"
            key={service.title}
          >
            <span className="service-card__number">0{index + 1}</span>
            <span className="service-card__copy">
              <span className="service-card__title">{service.title}</span>
              <span className="service-card__description">
                {service.description}
              </span>
            </span>
            <span className="service-card__arrow"><ArrowIcon /></span>
          </a>
        ))}
      </div>
    </section>
  );
}

function Milestones() {
  return (
    <section className="milestones" id="about">
      <div className="milestones__texture" aria-hidden="true" />
      <div className="milestones__inner">
        <div className="milestones__intro">
          <p className="eyebrow eyebrow--light">The bigger picture</p>
          <h2>Built on ideas.<br />Made to go further.</h2>
          <p>
            We believe the best work comes from staying curious, challenging
            ourselves, and making every detail matter.
          </p>
        </div>
        <div className="milestones__stats">
          {milestones.map((figure) => (
            <div className="stat" key={figure.label}>
              <span className="stat__value">{figure.value}</span>
              <span className="stat__label">{figure.label}</span>
            </div>
          ))}
        </div>
        <p className="milestones__note">Verified studio figures coming soon</p>
      </div>
    </section>
  );
}

function PartnerStrip() {
  return (
    <section className="partner-strip" aria-label="Our approach">
      <p className="eyebrow">An idea is only the beginning</p>
      <div className="partner-strip__line">
        <span>Strategy</span><i />
        <span>Design</span><i />
        <span>Digital</span><i />
        <span>Growth</span>
      </div>
    </section>
  );
}

function Principles() {
  return (
    <section className="principles" aria-label="Our vision and mission">
      <div className="principle">
        <span className="principle__symbol" aria-hidden="true">◎</span>
        <h2>Our vision</h2>
        <p>
          To be the creative partner that helps ambitious brands build a
          digital presence with lasting impact.
        </p>
      </div>
      <div className="principle">
        <span className="principle__symbol" aria-hidden="true">↗</span>
        <h2>Our mission</h2>
        <p>
          We turn ideas into meaningful brand stories through creativity,
          strategy, and thoughtful digital experiences.
        </p>
      </div>
    </section>
  );
}

function Portfolio() {
  const [activeCategory, setActiveCategory] = useState("View All");
  const visibleProjects =
    activeCategory === "View All"
      ? projects
      : projects.filter((project) => project.category === activeCategory);

  return (
    <section className="section work-section" id="work">
      <div className="section-heading section-heading--center">
        <p className="eyebrow">Selected concepts</p>
        <h2>Creativity is a matter of perspective.<br />Ours is always moving forward.</h2>
      </div>
      <div className="work-filters" aria-label="Filter projects by category">
        {categories.map((category) => (
          <button
            aria-pressed={activeCategory === category}
            className={`filter-button${activeCategory === category ? " is-active" : ""}`}
            key={category}
            onClick={() => setActiveCategory(category)}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>
      <div className="project-grid" aria-live="polite">
        {visibleProjects.map((project) => (
          <article
            className={`project-card ${project.className}`}
            key={project.title}
          >
            <div className="project-card__image">
              <Image
                alt={project.alt}
                fill
                sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 45vw"
                src={project.image}
              />
              <span className="project-card__badge">Demo concept</span>
              <span className="project-card__open" aria-hidden="true">
                <ArrowIcon />
              </span>
            </div>
            <div className="project-card__info">
              <h3>{project.title}</h3>
              <p>{project.category}<span> / </span>{project.type}</p>
            </div>
          </article>
        ))}
        {visibleProjects.length === 0 && (
          <p className="project-empty">
            Demo concepts for this category are coming soon.
          </p>
        )}
      </div>
      <p className="work-note">
        These are visual concepts, not commissioned client projects.
      </p>
    </section>
  );
}

function Contact() {
  const [formMessage, setFormMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!brand.email) {
      setFormMessage(brand.contactNote);
      return;
    }
    const formData = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Project enquiry from ${formData.get("name")}`);
    const body = encodeURIComponent(
      `Name: ${formData.get("name")}\nEmail: ${formData.get("email")}\n\n${formData.get("message")}`,
    );
    window.location.href = `mailto:${brand.email}?subject=${subject}&body=${body}`;
  }

  return (
    <section className="contact" id="contact">
      <div className="contact__intro">
        <p className="eyebrow eyebrow--light">Have a good one in mind?</p>
        <h2>Let’s make<br />something matter.</h2>
        <p>Tell us where you want to go. We’ll help you find the way.</p>
        <div className="contact__email">
          {brand.email ? (
            <a href={`mailto:${brand.email}`}>{brand.email}</a>
          ) : (
            <span>Email details to be added</span>
          )}
        </div>
      </div>
      <form className="contact-form" onSubmit={handleSubmit}>
        <label>
          Your name
          <input autoComplete="name" name="name" placeholder="Name" required />
        </label>
        <label>
          Email address
          <input
            autoComplete="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </label>
        <label>
          A little about your project
          <textarea
            name="message"
            placeholder="What would you like to make happen?"
            required
            rows={3}
          />
        </label>
        <button className="button button--light" type="submit">
          Send an enquiry <ArrowIcon />
        </button>
        <p aria-live="polite" className="contact-form__message">
          {formMessage}
        </p>
      </form>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <BrandLogo />
      <p>Ideas that reach further.</p>
      <nav aria-label="Footer navigation">
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#services">Services</a>
        <a href="#work">Work</a>
        <a href="#contact">Contact</a>
      </nav>
      <span className="site-footer__copyright">
        © {new Date().getFullYear()} Reach Agency
      </span>
    </footer>
  );
}

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <Milestones />
        <PartnerStrip />
        <Principles />
        <Portfolio />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
