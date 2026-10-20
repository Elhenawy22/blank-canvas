"use client";

import { useRef, useState, type FormEvent } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowIcon, WhatsAppIcon } from "@/components/icons";
import type { Dictionary } from "@/i18n/dictionaries";
import { brand } from "@/data/brand";
import { ensureGsap, gsap, prefersReducedMotion, EASE } from "@/lib/motion";

/**
 * Contact — closing conversion section.
 *
 * Behaviour is preserved from the original site: without an approved
 * business email configured in `src/data/brand.ts`, the form shows the
 * guidance note; once it is set, submitting opens the visitor's mail
 * application with prefilled subject/body. Nothing is sent to a server.
 */
export default function Contact({ dictionary }: { dictionary: Dictionary }) {
  const contact = dictionary.contact;
  const [formMessage, setFormMessage] = useState("");
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || prefersReducedMotion()) return;

      ensureGsap();

      gsap.from(section.querySelectorAll(".contact__intro > *"), {
        y: 40,
        autoAlpha: 0,
        duration: 0.95,
        ease: EASE.soft,
        stagger: 0.09,
        scrollTrigger: {
          trigger: section,
          start: "top 72%",
          once: true,
        },
      });

      gsap.from(section.querySelector(".contact-form"), {
        y: 56,
        autoAlpha: 0,
        duration: 1,
        ease: EASE.soft,
        scrollTrigger: {
          trigger: section.querySelector(".contact-form"),
          start: "top 82%",
          once: true,
        },
      });

      // Soft glow drift tied to scroll — the only scrub here.
      gsap.to(section.querySelector(".contact__glow"), {
        yPercent: -22,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.4,
        },
      });
    },
    { scope: sectionRef },
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!brand.email) {
      setFormMessage(contact.emptyEmailNote);
      return;
    }
    const formData = new FormData(form);
    const subject = encodeURIComponent(
      contact.form.mailtoSubjectTemplate.replace("%name%", String(formData.get("name") ?? "")),
    );
    const body = encodeURIComponent(
      contact.form.mailtoBodyTemplate
        .replace("%name%", String(formData.get("name") ?? ""))
        .replace("%email%", String(formData.get("email") ?? ""))
        .replace("%message%", String(formData.get("message") ?? "")),
    );
    window.location.href = `mailto:${brand.email}?subject=${subject}&body=${body}`;
  }

  return (
    <section className="contact" id="contact" ref={sectionRef}>
      <div aria-hidden="true" className="contact__glow" />

      <div className="contact__intro">
        <p className="eyebrow eyebrow--light">{contact.eyebrow}</p>
        <h2 aria-label={contact.linesAria}>
          {contact.lines[0]}
          <br />
          {contact.lines[1]}
        </h2>
        <p>{contact.description}</p>
        <div className="contact__details">
          <p className="contact__address">
            <span>{contact.addressLabel}</span>
            {contact.address}
          </p>
          <a
            className="button button--whatsapp"
            href={brand.whatsappHref}
            rel="noreferrer noopener"
            target="_blank"
          >
            <WhatsAppIcon />
            {contact.whatsappCta}
          </a>
          {brand.email ? (
            <a className="contact__email" dir="ltr" href={`mailto:${brand.email}`}>
              {brand.email}
            </a>
          ) : (
            <span className="contact__email">{contact.emailNote}</span>
          )}
        </div>
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        <label>
          {contact.form.nameLabel}
          <input autoComplete="name" name="name" placeholder={contact.form.namePlaceholder} required />
        </label>
        <label>
          {contact.form.emailLabel}
          <input
            autoComplete="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </label>
        <label>
          {contact.form.messageLabel}
          <textarea
            name="message"
            placeholder={contact.form.messagePlaceholder}
            required
            rows={3}
          />
        </label>
        <button className="button button--light" type="submit">
          {contact.form.submit} <ArrowIcon />
        </button>
        <p aria-live="polite" className="contact-form__message">
          {formMessage}
        </p>
      </form>
    </section>
  );
}
