import type { NavItem, FooterColumn, SocialLink } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  // { label: "Home", href: "/" },
  { label: "AI Courses", href: "/courses" },
  { label: "Direct2Hire", href: "/direct2hire" },
  // { label: "Internships", href: "/internships" },
  // { label: "Marketplace", href: "/marketplace" },
  // { label: "Webinar", href: "/webinar" },
  // { label: "Investors", href: "/investors" },
  // { label: "Contact", href: "/contact" },
  {
    label: "Corporate",
    children: [
      { label: "Investors", href: "/investors" },
      { label: "About", href: "/about" },
    ],
  },
  { label: "Partners", href: "/partners" },
  { label: "Blog", href: "/blog" },
];

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Platforms",
    items: [
      { label: "Learning", href: "/courses" },
      { label: "Direct2Hire", href: "/direct2hire" },
      // { label: "Marketplace", href: "/marketplace" },
      { label: "Partners", href: "/partners" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      // { label: "Careers", href: "/internships" },
      { label: "Investors", href: "/investors" },
      { label: "Contact", href: "/contact" },
    ],
  },

  {
    title: "Legal",
    items: [
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      // { label: "Investors", href: "/investors" },
    ],
  },
];

export const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: "instagram",
    href: "https://www.instagram.com/avataraiadoption/",
    label: "Instagram",
  },
  {
    platform: "x",
    href: "https://x.com/avataradoption",
    label: "X (Twitter)",
  },
  {
    platform: "youtube",
    href: "https://www.youtube.com/@Avataraiadoption",
    label: "YouTube",
  },
  {
    platform: "linkedin",
    href: "https://www.linkedin.com/company/avatar-india/",
    label: "LinkedIn",
  },
];
