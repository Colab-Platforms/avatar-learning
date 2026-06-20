import type { NavItem, FooterColumn, SocialLink } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "About",       href: "#about" },
  { label: "Solutions",   href: "#solutions" },
  { label: "Learning",    href: "#learning" },
  { label: "Marketplace", href: "#marketplace" },
];

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Platforms",
    items: [
      { label: "Learning", href: "#" },
      { label: "Marketplace", href: "#" },
      { label: "Solutions", href: "#" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Community", href: "#" },
      { label: "Talent network", href: "#" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Privacy Policy", href: "/privacy-policy" },
    ],
  },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { platform: "facebook", href: "#", label: "Facebook" },
  { platform: "instagram", href: "#", label: "Instagram" },
  { platform: "linkedin", href: "#", label: "LinkedIn" },
];
