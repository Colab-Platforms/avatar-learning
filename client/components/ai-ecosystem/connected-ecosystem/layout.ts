// Shared geometry + timing for the About page "Connected AI Ecosystem" visual.
// Everything is laid out in the panel's own coordinate space (507 × 580, the
// panel's aspect ratio), so the SVG lines and the HTML nodes always line up.
import type { LucideIcon } from "lucide-react";
import { Cloud, Sparkles, Workflow, MessagesSquare, Rocket, GraduationCap, ChartColumn, Puzzle } from "lucide-react";

export const VIEW_W = 507;
export const VIEW_H = 580;
export const CX = VIEW_W / 2;
export const CY = VIEW_H / 2;
/** Core width as a share of the panel width (about a third, per the brief). */
export const CORE_FRAC = 0.31;
/** Below this panel width (CSS px) the scene uses its lighter mobile settings. */
export const COMPACT_BELOW = 420;

export interface EcoNode {
  label: string;
  Icon: LucideIcon;
  /** 0 = first wave (4–6 s), 1 = second wave (6–8 s). */
  wave: 0 | 1;
  /** Order inside its wave. */
  order: number;
  /** Slot on the ring, 0 = top-right, clockwise. */
  slot: number;
}

// Clockwise from the top-left, in reveal order: the first wave fills the top and
// right side, the second wave the bottom and left side.
export const NODES: EcoNode[] = [
  { label: "SaaS", Icon: Cloud, wave: 0, order: 0, slot: 7 },
  { label: "AI Adoption", Icon: Rocket, wave: 0, order: 1, slot: 0 },
  { label: "AI Tools", Icon: Sparkles, wave: 0, order: 2, slot: 1 },
  { label: "Training", Icon: GraduationCap, wave: 0, order: 3, slot: 2 },
  { label: "Automation", Icon: Workflow, wave: 1, order: 0, slot: 3 },
  { label: "Analytics", Icon: ChartColumn, wave: 1, order: 1, slot: 4 },
  { label: "Consultation", Icon: MessagesSquare, wave: 1, order: 2, slot: 5 },
  { label: "Custom Solutions", Icon: Puzzle, wave: 1, order: 3, slot: 6 },
];

export interface Point {
  x: number;
  y: number;
}

/**
 * Slot positions: an upright ellipse around the core, offset by 22.5° so the
 * nodes form a left and a right column (four each) with clear space above and
 * below the core. Top/bottom pairs are pushed apart a little so their labels
 * never meet. On narrow (compact) panels every card reserves two label lines,
 * so the top and bottom pairs move a little further out to keep clear of the
 * side cards.
 */
export function slotPoint(slot: number, compact = false): Point {
  const a = ((-67.5 + slot * 45) * Math.PI) / 180;
  const rx = 172;
  const ry = 212;
  let dx = Math.cos(a) * rx;
  let dy = Math.sin(a) * ry;
  if (Math.abs(dy) > ry * 0.8) {
    dx *= 1.15;
    if (compact) dy *= 1.11;
  }
  return { x: CX + dx, y: CY + dy };
}

export interface LinkPath {
  p: Point;
  c: Point;
  d: string;
}

/** Curved core → node paths for the current layout (index-aligned with NODES). */
export function linkPaths(compact: boolean): LinkPath[] {
  return NODES.map((n) => {
    const p = slotPoint(n.slot, compact);
    const c = curveControl(p);
    return { p, c, d: `M${CX} ${CY} Q${c.x.toFixed(1)} ${c.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}` };
  });
}

/** Control point for a gentle curve from the core to a node (all bow the same way round). */
export function curveControl(p: Point): Point {
  const mx = (CX + p.x) / 2;
  const my = (CY + p.y) / 2;
  const dx = p.x - CX;
  const dy = p.y - CY;
  const k = 0.14;
  return { x: mx - dy * k, y: my + dx * k };
}

/** Point on the quadratic curve core → control → node at u ∈ [0, 1]. */
export function curvePoint(p: Point, c: Point, u: number): Point {
  const v = 1 - u;
  return {
    x: v * v * CX + 2 * v * u * c.x + u * u * p.x,
    y: v * v * CY + 2 * v * u * c.y + u * u * p.y,
  };
}

/**
 * Timeline in seconds. The reveal plays once:
 *   0–2 s core + logo · 2–4 s all lines draw outward, particles start ·
 *   4–6 s first four modules · 6–8 s last four · 8–10 s first pulse.
 * Afterwards nothing hides again; only the ambient motion and the pulse repeat.
 */
export const T = {
  coreIn: 0.25,
  coreDur: 1.75,
  glowUp: 2.0,
  lines: 2.0,
  lineStep: 0.18,
  lineDur: 0.8,
  nodes: [4.0, 6.0] as const,
  nodeStep: 0.45,
  pulse: 8.2,
  pulseDur: 1.7,
  period: 10,
};

/** Clockwise position 0–7 (SaaS first). */
const seq = (n: EcoNode) => n.wave * 4 + n.order;

export function lineStart(n: EcoNode) {
  return T.lines + seq(n) * T.lineStep;
}
export function lineDur(_n?: EcoNode) {
  return T.lineDur;
}
export function nodeStart(n: EcoNode) {
  return T.nodes[n.wave] + n.order * T.nodeStep;
}
