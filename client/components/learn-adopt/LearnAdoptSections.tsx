import Image from "next/image";
import Link from "next/link";
import {
  LA_ABOUT,
  LA_AUDIENCES,
  LA_CONTACT,
  LA_CONTACT_COPY,
  LA_FAQS,
  LA_FOOTER,
  LA_TRUST,
  LA_VISION,
  LA_WHY,
} from "./data";
import { ArrowRight, ContactIcon, TrustIcon } from "./icons";
import { PillarTabs } from "./PillarTabs";
import { NeuralSphere } from "./NeuralSphere";
import { WhyCards } from "./WhyCards";
import { Magnetic } from "./Magnetic";
import { rv, Words, type HeadingFx } from "./motion";
import s from "./learnAdopt.module.css";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className={s.eyebrow} {...rv(0, "eyebrow")}>
      <span>{children}</span>
    </p>
  );
}

export function TrustStrip() {
  return (
    <section className={s.trustSection} aria-label="Why trust Avatar">
      <div className={`${s.wrap} ${s.trust}`}>
        {LA_TRUST.map((t, i) => (
          <div key={t.title} className={`${s.glass} ${s.trustItem}`} {...rv(i)}>
            <TrustIcon name={t.icon} className={s.trustIcon} />
            <span>
              <strong>{t.title}</strong>
              <span>{t.sub}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function PillarsSection() {
  return (
    <section className={s.section} id="ecosystem">
      <div className={s.wrap}>
        <Eyebrow>The Avatar ecosystem</Eyebrow>
        <h2 className={s.h2} {...rv(1, "words", "move")}>
            <Words text="Four pillars," /> <strong><Words text="one platform." from={2} /></strong>
          </h2>
        <p className={`${s.body} ${s.intro}`} {...rv(2)}>
          One connected platform for learners, professionals and businesses. Pick a pillar to see what it covers.
        </p>
        <PillarTabs />
      </div>
    </section>
  );
}

/** Two-part heading: plain lead-in, highlighted second half, word-animated. */
function Heading({ parts, fx }: { parts: readonly string[]; fx: HeadingFx }) {
  return (
    <h2 className={s.h2} {...rv(1, "words", fx)}>
      <Words text={parts[0]} /> <strong><Words text={parts[1]} from={parts[0].split(" ").length} /></strong>
    </h2>
  );
}

export function AboutSection() {
  return (
    <section className={s.section} id="about">
      <div className={`${s.wrap} ${s.aboutLayout}`}>
        <div className={s.aboutText} data-parallax="-0.04">
          <Eyebrow>{LA_ABOUT.label}</Eyebrow>
          <Heading parts={LA_ABOUT.heading} fx="blur" />
          {LA_ABOUT.body.map((p, i) => (
            <p key={p} className={s.body} {...rv(2 + i)}>
              {p}
            </p>
          ))}
          <Link href="/about" className={s.btnText} {...rv(4)}>
            About Us
            <ArrowRight className={s.arrow} />
          </Link>
        </div>
        <div className={s.aboutFacts} data-parallax="0.08">
          {LA_ABOUT.taglines.map((line, i) => (
            <div key={line} className={`${s.glass} ${s.aboutFact} ${s.taglineRow}`} {...rv(i, "right")}>
              <span className={s.pillarNum}>{String(i + 1).padStart(2, "0")}</span>
              <strong className={s.h3}>{line}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AudienceSection() {
  return (
    <section className={s.section} id="who">
      <div className={s.wrap}>
        <div className={s.headRow}>
          <div>
            <Eyebrow>Who we serve</Eyebrow>
            <h2 className={s.h2} {...rv(1, "words", "flip")}>
            <Words text="Who Avatar" /> <strong><Words text="serves." from={2} /></strong>
          </h2>
          </div>
          <p className={s.body} {...rv(2)}>
            Learners, businesses and institutions — three audiences at different points of the same AI journey.
          </p>
        </div>
        <div className={`${s.grid} ${s.grid3}`}>
          {LA_AUDIENCES.map((a, i) => (
            <Link key={a.title} href={a.href} className={`${s.glass} ${s.audience}`} {...rv(i, "tilt")}>
              {/* Image slot — left empty until final photography is ready */}
              <span className={s.audienceImg} aria-hidden="true" />
              <span className={s.audienceText}>
                <strong className={s.h3}>{a.title}</strong>
                <span className={s.body}>{a.body}</span>
              </span>
              <ArrowRight className={s.cardArrow} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhySection() {
  return (
    <section className={s.section} id="why">
      <div className={s.wrap}>
        <Heading parts={LA_WHY.heading} fx="blur" />
        <WhyCards />
      </div>
    </section>
  );
}

export function VisionSection() {
  return (
    <section className={`${s.section} ${s.visionOpen}`} id="vision">
      <div className={s.wrap}>
        <span className={s.visionGlow} aria-hidden="true" />
        <Eyebrow>{LA_VISION.label}</Eyebrow>
        <h2 className={s.visionHeading} {...rv(1, "words", "rise")}>
          <Words text={LA_VISION.heading[0]} />{" "}
          <strong>
            <Words text={LA_VISION.heading[1]} from={LA_VISION.heading[0].split(" ").length} />
          </strong>
        </h2>
        <span className={s.visionRule} {...rv(2, "eyebrow")} aria-hidden="true" />
        <div className={s.visionCols}>
          {LA_VISION.body.map((p, i) => (
            <p key={p} className={s.visionText} {...rv(3 + i)}>
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <section className={s.section} id="contact">
      <div className={`${s.wrap} ${s.aboutLayout}`}>
        <div className={s.aboutText}>
          <Eyebrow>{LA_CONTACT_COPY.label}</Eyebrow>
          <Heading parts={LA_CONTACT_COPY.heading} fx="rise" />
          {LA_CONTACT_COPY.body.map((p, i) => (
            <p key={p} className={s.body} {...rv(2 + i)}>
              {p}
            </p>
          ))}
          <div className={s.actions} {...rv(4)}>
            <Magnetic>
              <Link href="/contact" className={s.btnPrimary}>
                Contact Us
                <ArrowRight className={s.arrow} />
              </Link>
            </Magnetic>
            <Magnetic strength={0.25}>
              <Link href="/quiz" className={s.btnText}>
                Take the career quiz
                <ArrowRight className={s.arrow} />
              </Link>
            </Magnetic>
          </div>
        </div>
        <div className={s.aboutFacts}>
          {LA_CONTACT.map((c, i) => (
            <a
              key={c.label}
              {...rv(i, "right")}
              href={c.href}
              className={`${s.glass} ${s.contactRow}`}
              {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <ContactIcon name={c.icon} className={s.trustIcon} />
              <span>
                <span className={s.contactLabel}>{c.label}</span>
                <strong>{c.value}</strong>
              </span>
              <ArrowRight className={s.arrow} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section className={s.section} id="faq">
      <div className={`${s.wrap} ${s.faqLayout}`}>
        <div className={s.faqSide}>
          <Eyebrow>FAQ</Eyebrow>
          <h2 className={s.h2} {...rv(1, "words", "blur")}>
            <Words text="Questions," /> <strong><Words text="answered." from={1} /></strong>
          </h2>
          <p className={s.body} {...rv(2)}>Still unsure about something? Our team replies within a working day.</p>
          <Link href="/contact" className={s.btnText} {...rv(3)}>
            Talk to us
            <ArrowRight className={s.arrow} />
          </Link>
          <div className={s.faqPhoto} {...rv(4)} aria-hidden="true">
            <NeuralSphere />
          </div>
        </div>
        <div className={s.faqList}>
          {LA_FAQS.map((f, i) => (
            <details key={f.q} className={`${s.glass} ${s.faqItem}`} open={i === 0} {...rv(i)}>
              <summary>
                {f.q}
                <span className={s.faqToggle} aria-hidden="true" />
              </summary>
              <p className={s.body}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GetStartedSection() {
  return (
    <section className={s.section}>
      <div className={s.wrap}>
        <div className={`${s.glass} ${s.cta}`} {...rv(0, "zoom")}>
          <span className={s.statusChip}>Get started</span>
          <h2 className={s.h2} {...rv(1, "words", "wipe")}>
            <Words text="Take the first step" /> <strong><Words text="with Avatar today." from={4} /></strong>
          </h2>
          <p className={s.body} {...rv(2)}>Tell us where you are today and we&apos;ll point you to the right part of Avatar.</p>
          <div className={s.actions}>
            <Link href="/contact" className={s.btnPrimary}>
              Talk to our team
              <ArrowRight className={s.arrow} />
            </Link>
            <Link href="/quiz" className={s.btnText}>
              Take the career quiz
              <ArrowRight className={s.arrow} />
            </Link>
          </div>
          <p className={s.ctaNote}>No obligation · We reply within one working day</p>
        </div>
      </div>
    </section>
  );
}

export function LearnAdoptFooter() {
  return (
    <footer className={s.footer}>
      <div className={`${s.wrap} ${s.footerGrid}`}>
        <div className={s.footerBrand} {...rv(0)}>
          <Image src="/landingpage-images/Avatar_logo_Light.svg" alt="Avatar" width={119} height={32} />
          <p>© {new Date().getFullYear()} AVATAR India. All rights reserved.</p>
        </div>
        {LA_FOOTER.map((col) => (
          <div key={col.title} className={s.footerCol} {...rv(1)}>
            <strong>{col.title}</strong>
            {col.links.map((l) => (
              <Link key={l.label} href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
