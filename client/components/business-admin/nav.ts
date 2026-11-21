import {
  BarChart3,
  Bot,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Plug,
  Settings,
  ShieldCheck,
  Target,
  UserCog,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export const BASE = "/admin-adaption";

export interface BusinessNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  /** Module permission needed to see and use this page (also enforced by the API). */
  module: string;
}

export const BUSINESS_NAV: BusinessNavItem[] = [
  { href: BASE, label: "Dashboard", icon: LayoutDashboard, exact: true, module: "dashboard" },
  { href: `${BASE}/inbox`, label: "WhatsApp Inbox", icon: MessageCircle, module: "inbox" },
  { href: `${BASE}/leads`, label: "CRM & Leads", icon: Target, module: "leads" },
  { href: `${BASE}/agents`, label: "AI Agents", icon: Bot, module: "agents" },
  { href: `${BASE}/automations`, label: "Automations", icon: Workflow, module: "automations" },
  // Email Automation (Resend). Its API is gated by the "integrations" module, so the page is too.
  { href: `${BASE}/email-automation`, label: "Email Automation", icon: Mail, module: "integrations" },
  { href: `${BASE}/integrations`, label: "Integrations", icon: Plug, module: "integrations" },
  { href: `${BASE}/analytics`, label: "Analytics", icon: BarChart3, module: "analytics" },
  { href: `${BASE}/team`, label: "Team Management", icon: ShieldCheck, module: "team" },
  { href: `${BASE}/admins`, label: "Admin Management", icon: UserCog, module: "admins" },
  { href: `${BASE}/settings`, label: "Settings", icon: Settings, module: "settings" },
];

/** Navigation the signed-in person is allowed to see (the API enforces the same permissions independently). */
export const navFor = (modules: string[]): BusinessNavItem[] => BUSINESS_NAV.filter((i) => modules.includes(i.module));

export const isNavActive = (pathname: string, item: BusinessNavItem) =>
  item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
