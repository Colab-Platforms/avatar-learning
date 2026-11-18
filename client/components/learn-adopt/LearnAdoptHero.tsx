import Link from "next/link";
import { LA_HERO_CARDS, LA_STRIP } from "./data";
import { ArrowRight, CardIcon } from "./icons";
import { LearnAdoptNav } from "./LearnAdoptNav";
import { Words } from "./motion";
import s from "./learnAdopt.module.css";

const SLOT = [s.card1, s.card2, s.card3];

export function LearnAdoptHero() {
  return (
    <header className={s.hero}>
      <div className={s.stage}>
        <LearnAdoptNav />

        <div className={s.copy}>
          <p className={s.eyebrow}>
            <span>Learn · Adopt · Grow with AI</span>
          </p>
          <h1 className={s.h1}>
            <Words text="From learning AI" />
            <br />
            <Words text="to" from={3} /> <strong><Words text="adopting AI." from={4} /></strong>
          </h1>
          <p className={s.lede}>
            Avatar helps people and teams build real AI skills, apply them to everyday work and roll them
            out across the business.
          </p>
          <div className={s.actions}>
            <Link href="#ecosystem" className={s.btnPrimary}>
              Explore the Ecosystem
              <ArrowRight className={s.arrow} />
            </Link>
            <Link href="/courses" className={s.btnText}>
              Start Learning
              <ArrowRight className={s.arrow} />
            </Link>
          </div>
        </div>

        {/* Artwork with the glass cards pinned to its card slots. The cards
            are positioned in % of the artwork so they stay locked to it at
            every size. */}
        <div className={s.art}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landingpage-images/ai-hero-art.jpg"
            alt=""
            width={970}
            height={805}
            className={s.artImg}
            fetchPriority="high"
          />
          {LA_HERO_CARDS.map((c, i) => (
            <Link key={c.num} href={c.href} className={`${s.card} ${SLOT[i]}`} aria-label={c.title.join(" ")}>
              <span className={s.cardNum}>{c.num}</span>
              <CardIcon name={c.icon} className={s.cardIcon} />
              <span className={s.cardTitle}>
                {c.title[0]}
                <br />
                {c.title[1]}
              </span>
              <span className={s.cardDesc}>
                {c.desc[0]}
                <br />
                {c.desc[1]}
              </span>
              <ArrowRight className={s.cardArrow} />
              {i === 2 && (
                <span className={s.tiles} aria-hidden="true">
                  {Array.from({ length: 6 }, (_, k) => (
                    <i key={k} />
                  ))}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Readable copy of the cards for narrow screens, where the pinned
            cards are too small to carry text. */}
        <div className={s.mobileCards}>
          {LA_HERO_CARDS.map((c) => (
            <Link key={c.num} href={c.href} className={s.mobileCard}>
              <span className={s.cardNum}>{c.num}</span>
              <CardIcon name={c.icon} className={s.mobileCardIcon} />
              <span className={s.mobileCardText}>
                <strong>{c.title.join(" ")}</strong>
                <span>{c.desc.join(" ")}</span>
              </span>
              <ArrowRight className={s.arrow} />
            </Link>
          ))}
        </div>

        <ul className={s.strip}>
          {LA_STRIP.map((it) => (
            <li key={it.num}>
              <span className={s.stripNum}>{it.num}</span>
              <strong>{it.title}</strong>
              <span>{it.sub}</span>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
