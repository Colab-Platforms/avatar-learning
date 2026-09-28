import type { LucideIcon } from "lucide-react";
import {
  Users2,
  PackageCheck,
  PenTool,
  Sparkles,
  SlidersHorizontal,
  TrendingUp,
  Layers,
  Search,
  Rocket,
  ShieldCheck,
  Building2,
  BarChart3,
} from "lucide-react";

export interface GoalCard {
  title: string;
  body: string;
}

export const GOALS: GoalCard[] = [
  {
    title: "Make AI Accessible",
    body: "Make practical AI knowledge, learning, and tools accessible to more people.",
  },
  {
    title: "Build AI Talent",
    body: "Help individuals develop relevant AI skills and connect those skills with real opportunities.",
  },
  {
    title: "Enable AI Adoption",
    body: "Help businesses identify and adopt AI solutions that address real operational needs.",
  },
  {
    title: "Create Real Impact",
    body: "Turn AI knowledge and technology into practical outcomes for people and businesses.",
  },
];

export interface EcosystemService {
  id: "crm" | "oms" | "content";
  name: string;
  tagline: string;
  description: string;
  benefits: string[];
  icon: LucideIcon;
  /** Short data-flow steps shown when the card is open — purely visual, not new claims. */
  flow: string[];
}

export const SERVICES: EcosystemService[] = [
  {
    id: "crm",
    name: "CRM",
    tagline: "Manage leads, customers, sales and team performance.",
    description:
      "A unified workspace to track every lead and customer relationship — from first contact to closed deal — without losing context along the way.",
    benefits: [
      "Centralized lead & customer database",
      "Real-time sales pipeline tracking",
      "Automated follow-ups & reminders",
      "Team performance dashboards",
    ],
    icon: Users2,
    flow: ["Leads", "Pipeline", "Follow-ups", "Sales Insights"],
  },
  {
    id: "oms",
    name: "OMS",
    tagline: "Manage orders, operations and fulfilment efficiently.",
    description:
      "Streamline the complete order lifecycle — from order creation and payment to processing, fulfilment and delivery — through one centralized system.",
    benefits: [
      "Centralized order management",
      "Real-time order status tracking",
      "Automated order processing",
      "Inventory & availability visibility",
      "Fulfilment and delivery management",
      "Order history and reporting",
    ],
    icon: PackageCheck,
    flow: ["Orders", "Payment", "Inventory", "Fulfilment", "Delivery"],
  },
  {
    id: "content",
    name: "AI Content Writing",
    tagline: "Create faster, consistent and business-ready content with AI.",
    description:
      "Create high-quality business content faster with AI-assisted workflows designed to maintain your brand voice, messaging and communication style.",
    benefits: [
      "AI-assisted content creation",
      "Blogs, social media & marketing content",
      "Email and promotional copy",
      "Brand tone & style consistency",
      "Content rewriting and refinement",
      "Faster content production",
    ],
    icon: PenTool,
    flow: ["Idea", "Generate", "Refine", "Publish"],
  },
];

export interface CustomSolutionPoint {
  icon: LucideIcon;
  label: string;
}

export const CUSTOM_SOLUTION_EXAMPLES: CustomSolutionPoint[] = [
  { icon: Layers, label: "Workflow Automation" },
  { icon: Search, label: "AI-Powered Analytics" },
  { icon: SlidersHorizontal, label: "Custom Integrations" },
  { icon: Rocket, label: "Industry-Specific Tools" },
];

export interface AudienceCard {
  icon: LucideIcon;
  title: string;
  description: string;
  points: string[];
}

export const WHO_WE_SERVE: AudienceCard[] = [
  {
    icon: Building2,
    title: "Growing Businesses & SMEs",
    description: "Businesses looking to adopt AI without building everything in-house.",
    points: [
      "Companies wanting automation and better operational efficiency",
      "Businesses with sales, customer support, or repetitive workflows",
    ],
  },
  {
    icon: BarChart3,
    title: "Sales-Driven Businesses",
    description: "Companies managing large volumes of leads and customers.",
    points: [
      "CRM and lead management",
      "Follow-ups and customer engagement",
      "Analytics and sales automation",
    ],
  },
  {
    icon: PenTool,
    title: "AI-Powered Content",
    description: "Businesses that need to create consistent content faster with AI.",
    points: [
      "Marketing teams",
      "Sales teams",
      "Blogs, social media, emails and promotional content",
    ],
  },
  {
    icon: SlidersHorizontal,
    title: "Custom AI Solutions",
    description: "Businesses with specific challenges that cannot be solved by an off-the-shelf tool.",
    points: [
      "AI agents",
      "Custom integrations",
      "Intelligent workflows",
      "Business-specific automation",
    ],
  },
];

export interface PricingTier {
  name: string;
  tagline: string;
  featured?: boolean;
  inclusions: string[];
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter",
    tagline: "For small teams getting started with one AI solution.",
    inclusions: [
      "One core module (CRM, OMS or Content)",
      "Standard support",
      "Guided onboarding",
    ],
  },
  {
    name: "Growth",
    tagline: "For businesses scaling across multiple workflows.",
    featured: true,
    inclusions: [
      "Multiple modules, connected",
      "Priority support",
      "Dedicated onboarding specialist",
    ],
  },
  {
    name: "Enterprise",
    tagline: "For organizations adopting AI across the full ecosystem.",
    inclusions: [
      "Full ecosystem access",
      "Dedicated success manager",
      "Custom integrations & workflows",
    ],
  },
];

export interface WhyAvatarPoint {
  icon: LucideIcon;
  title: string;
  body: string;
}

export const WHY_AVATAR: WhyAvatarPoint[] = [
  {
    icon: Sparkles,
    title: "AI-Powered Business Solutions",
    body: "Every tool in the ecosystem is built around practical AI — not bolted on as an afterthought.",
  },
  {
    icon: SlidersHorizontal,
    title: "Customizable to Your Business",
    body: "Configured around how your team actually works, not a rigid one-size-fits-all setup.",
  },
  {
    icon: TrendingUp,
    title: "Scalable for Growing Teams",
    body: "Start with one workflow and expand — the platform grows alongside your business.",
  },
  {
    icon: ShieldCheck,
    title: "One Ecosystem, Every Workflow",
    body: "CRM, operations, content and more — connected under a single, unified platform.",
  },
];
