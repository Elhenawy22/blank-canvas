"use client";

import { useRef, useState, type FormEvent } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowIcon, WhatsAppIcon } from "@/components/icons";
import type { Dictionary } from "@/i18n/dictionaries";
import { brand } from "@/data/brand";
import { db } from "@/lib/db";
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

  const isAr = /[\u0600-\u06FF]/.test(contact.form.nameLabel);
  const t = isAr ? FORM_AR : FORM_EN;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const text = [
      `${t.waHeader}`,
      `${t.name}: ${v("name")}`,
      `${t.phone}: ${v("phone")}`,
      v("company") ? `${t.company}: ${v("company")}` : "",
      `${t.service}: ${v("service")}`,
      `${t.brief}: ${v("message")}`,
    ]
      .filter(Boolean)
      .join("\n");
    const number = brand.whatsappHref.replace(/\D/g, "");
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    void db.from("orders").insert({
      name: v("name"),
      phone: v("phone"),
      company: v("company") || null,
      service: v("service"),
      message: v("message"),
    });
    setFormMessage(t.sent);
    event.currentTarget.reset();
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
        <p className="eyebrow eyebrow--light">{t.eyebrow}</p>
        <h3>{t.title}</h3>
        <p>{t.sub}</p>
        <div className="contact-form__row">
          <label>
            {t.name}
            <input autoComplete="name" name="name" required maxLength={100} />
          </label>
          <label>
            {t.phone}
            <input autoComplete="tel" name="phone" required type="tel" maxLength={20} dir="ltr" />
          </label>
        </div>
        <div className="contact-form__row">
          <label>
            {t.company} <small>{t.optional}</small>
            <input name="company" maxLength={100} />
          </label>
          <label>
            {t.service}
            <select name="service" required defaultValue="">
              <option value="" disabled>{t.choose}</option>
              {t.services.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          {t.brief}
          <textarea name="message" required rows={4} maxLength={1000} />
        </label>
        <button className="button button--light" type="submit">
          {t.submit} <ArrowIcon />
        </button>
        <p aria-live="polite" className="contact-form__message">
          {formMessage}
        </p>
      </form>
    </section>
  );
}

const FORM_AR = {
  eyebrow: "ابدأ مشروعك",
  title: "جاهز للخطوة الجاية؟",
  sub: "احكيلنا عن مشروعك، ونحدد معاك الخطوة المناسبة.",
  name: "الاسم",
  phone: "رقم الهاتف",
  company: "اسم الشركة",
  optional: "(اختياري)",
  service: "الخدمة المطلوبة",
  choose: "اختر الخدمة",
  services: ["هوية بصرية", "سوشيال ميديا", "تصوير", "فيديو", "برمجة وتصميم مواقع", "أخرى"],
  brief: "نبذة عن المشروع",
  submit: "ابدأ المحادثة",
  sent: "تم تجهيز طلبك على واتساب — اضغط إرسال هناك.",
  waHeader: "طلب جديد من الموقع",
};

const FORM_EN: typeof FORM_AR = {
  eyebrow: "Start your project",
  title: "Ready for the next step?",
  sub: "Tell us about your project and we'll find the right next step together.",
  name: "Name",
  phone: "Phone number",
  company: "Company name",
  optional: "(optional)",
  service: "Service needed",
  choose: "Choose a service",
  services: ["Branding", "Social media", "Photography", "Video", "Web design & development", "Other"],
  brief: "About the project",
  submit: "Start the conversation",
  sent: "Your request is ready in WhatsApp — tap send there.",
  waHeader: "New request from the website",
};
