// Shared SEO helpers: canonical domain, per-page metadata and JSON-LD.
// The primary brand site is the Avatar AI Adoption Ecosystem at https://www.avatarindia.com/;
// Avatar Learning lives under its own routes (/learning, /courses, /direct2hire, …) on the same domain.
import type { Metadata } from "next";
import { COMPANY, CONTACT, ADOPTION_SOCIAL_LINKS } from "@/components/ai-ecosystem/data";
import { SOCIAL_LINKS } from "@/data/navigation";

/** Primary (www) origin. Non-www and preview hosts must not appear in canonicals or the sitemap. */
export const SITE_URL = "https://www.avatarindia.com";
export const BRAND = "Avatar India";

/** 1200×630 social preview card (public/og-image.png). */
export const OG_IMAGE = {
  url: "https://www.avatarindia.com/og-image.png",
  width: 1200,
  height: 630,
  alt: "Avatar India: Avatar AI Adoption Ecosystem and Avatar Learning",
};

interface PageMetaInput {
  title: string;
  description: string;
  /** Path of the page, e.g. "/tools". Used for the canonical and og:url. */
  path: string;
  keywords?: string[];
  /** Adds the AI Adoption X handle to the Twitter card. */
  adoption?: boolean;
}

/**
 * Complete metadata for an indexable public page: title, description, self-referencing
 * canonical, Open Graph and Twitter card (Next replaces, rather than merges, nested
 * objects such as openGraph, so each page gets the full set).
 */
export function pageMetadata({ title, description, path, keywords, adoption }: PageMetaInput): Metadata {
  // Always absolute www URLs. The root layout deliberately sets no metadataBase: with one, Next
  // rewrites the homepage canonical to "https://www.avatarindia.com" (no trailing slash).
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: BRAND,
      locale: "en_IN",
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE.url],
      ...(adoption ? { site: "@avataradoption" } : {}),
    },
  };
}

const sameAs = [...new Set([...ADOPTION_SOCIAL_LINKS, ...SOCIAL_LINKS].map((s) => s.href))];

/** Organization + WebSite structured data for the homepage. */
export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: BRAND,
        alternateName: ["Avatar AI", "Avatar AI Adoption Ecosystem", "Avatar Industries Limited"],
        legalName: "Avatar Industries Limited",
        url: `${SITE_URL}/`,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.png`, width: 1024, height: 1024 },
        description:
          "Avatar India offers AI learning programs, business automation tools (CRM, HRMS, OMS), the Avatar AI Adoption Ecosystem and recruitment solutions for businesses and professionals.",
        identifier: { "@type": "PropertyValue", propertyID: "CIN", value: COMPANY.cin },
        address: {
          "@type": "PostalAddress",
          streetAddress: "NESCO IT Park, 10th Floor, Building 4, Goregaon East",
          addressLocality: "Mumbai",
          addressRegion: "Maharashtra",
          postalCode: "400063",
          addressCountry: "IN",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          email: CONTACT.email,
          telephone: CONTACT.phone.replace(/\s+/g, ""),
          areaServed: "IN",
          availableLanguage: ["en"],
        },
        sameAs,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: BRAND, // "Avatar India": the site name Google shows above the result
        alternateName: ["Avatar AI", "Avatar AI Adoption Ecosystem", "Avatar Learning"],
        url: `${SITE_URL}/`,
        inLanguage: "en-IN",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
}

/** Safe inline JSON-LD: escapes "<" so content can never close the script tag. */
export function jsonLdScript(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
