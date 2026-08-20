import type { NavItem, FooterColumn, SocialLink } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  // { label: "Home", href: "/" },
  { label: "AI Courses", href: "/courses" },
  { label: "Direct2Hire", href: "/direct2hire" },
  // { label: "Internships", href: "/internships" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Webinar", href: "/webinar" },
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
    platform: "facebook",
    href: "https://www.facebook.com/profile.php?id=61589319364156",
    label: "Facebook",
  },
  {
    platform: "instagram",
    href: "https://www.instagram.com/avatar.india/",
    label: "Instagram",
  },
  {
    platform: "linkedin",
    href: "https://www.linkedin.com/company/avatar-india/?viewAsMember=true",
    label: "LinkedIn",
  },
  {
    platform: "youtube",
    href: "https://www.youtube.com/@AvatarIndia-g1i",
    label: "YouTube",
  },
];
