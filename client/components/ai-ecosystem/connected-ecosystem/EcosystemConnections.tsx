"use client";

import { CX, CY, VIEW_W, VIEW_H, NODES, lineDur, lineStart, type LinkPath } from "./layout";
import styles from "./connectedEcosystem.module.css";

/** Pointy-top hexagon used when WebGL is unavailable (static core). */
const HEX_R = (VIEW_W * 0.31) / Math.sqrt(3);
const HEX = Array.from({ length: 6 }, (_, i) => {
  const a = Math.PI / 2 + (i * Math.PI) / 3;
  return `${(CX + Math.cos(a) * HEX_R).toFixed(1)},${(CY + Math.sin(a) * HEX_R).toFixed(1)}`;
}).join(" ");

interface Props {
  paths: LinkPath[];
  active: number | null;
  particlesPerLine: number;
  showFallbackCore: boolean;
}

/**
 * Thin curved connections from the core to each node. Each line carries small
 * light particles (a dot plus a short trail that lights the line as it passes)
 * flowing from the core outwards, and the periodic pulse. Their positions are
 * written straight to the DOM by the parent's animation loop (found via data
 * attributes), so this component never re-renders per frame.
 * It also draws a static SVG core when WebGL is unavailable.
 */
export function EcosystemConnections({ paths, active, particlesPerLine, showFallbackCore }: Props) {
  return (
    <svg className={styles.lines} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        {paths.map(({ p }, i) => (
          <linearGradient key={i} id={`cae-grad-${i}`} gradientUnits="userSpaceOnUse" x1={CX} y1={CY} x2={p.x} y2={p.y}>
            <stop offset="0" stopColor="#16b8ac" stopOpacity="0.7" />
            <stop offset="1" stopColor="#58c4dc" stopOpacity="0.42" />
          </linearGradient>
        ))}
        <radialGradient id="cae-halo">
          <stop offset="0" stopColor="#16b8ac" stopOpacity="0.16" />
          <stop offset="1" stopColor="#16b8ac" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cae-core-fill" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#12383d" />
          <stop offset="1" stopColor="#0a1215" />
        </radialGradient>
      </defs>

      {paths.map(({ d }, i) => {
        const n = NODES[i];
        const vars = { "--d": `${lineStart(n)}s`, "--dur": `${lineDur(n)}s` } as React.CSSProperties;
        const cls = [styles.link, active === i && styles.linkActive].filter(Boolean).join(" ");
        return (
          <g key={i} className={cls}>
            <path className={styles.linkGlow} d={d} pathLength={1} />
            <path className={styles.linkLine} d={d} pathLength={1} stroke={`url(#cae-grad-${i})`} style={vars} />
            <path className={styles.linkPulse} d={d} pathLength={1} data-pulse={i} />
            {Array.from({ length: particlesPerLine }, (_, j) => (
              <g key={j} data-particle={`${i}:${j}`} className={styles.particle}>
                <path className={styles.trail} d={d} pathLength={1} />
                <circle className={styles.dot} r={j === 0 ? 2.4 : 2} cx={CX} cy={CY} />
              </g>
            ))}
          </g>
        );
      })}

      {showFallbackCore && (
        <g className={styles.fallbackCore}>
          <circle cx={CX} cy={CY} r={HEX_R * 2.2} fill="url(#cae-halo)" />
          <polygon points={HEX} fill="url(#cae-core-fill)" stroke="#58c4dc" strokeOpacity="0.8" strokeWidth="1.4" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}
