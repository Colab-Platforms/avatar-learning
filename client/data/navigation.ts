import type { NavItem, FooterColumn, SocialLink } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Learning", href: "/courses" },
  { label: "Marketplace", href: "#" },
  { label: "Contact", href: "/contact" },
  { label: "About", href: "/about" },
];

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: "Platforms",
    items: [
      { label: "Learning", href: "/courses" },
      { label: "Marketplace", href: "/marketplace" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/internship" },
      { label: "Contact", href: "/contact" },
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
  {
    platform: "facebook",
    href: "https://www.facebook.com/share/1JpYwqS4jQ/",
    label: "Facebook",
  },
  {
    platform: "instagram",
    href: "https://www.instagram.com/avatar.india/",
    label: "Instagram",
  },
  {
    platform: "linkedin",
    href: "https://linkedin.com/in/avatar-india-358b39413/",
    label: "LinkedIn",
  },
  {
    platform: "youtube",
    href: "https://www.youtube.com/@AvatarIndia-g1i",
    label: "YouTube",
  },
];
