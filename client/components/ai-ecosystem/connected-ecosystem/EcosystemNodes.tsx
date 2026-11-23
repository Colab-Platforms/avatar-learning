"use client";

import { CX, CY, VIEW_W, VIEW_H, NODES, nodeStart, type LinkPath } from "./layout";
import styles from "./connectedEcosystem.module.css";

interface Props {
  paths: LinkPath[];
  active: number | null;
  onHover: (i: number | null) => void;
}

/** Cards whose border breathes softly once the scene is complete (spread round the ring). */
const BREATHE = new Map([
  [1, 0],
  [3, 2.6],
  [6, 5.2],
]);

/**
 * The eight modules. HTML rather than WebGL so labels stay sharp and scale with
 * the panel (container-query units). Hover is mouse-only, so a tap on a phone
 * never leaves a node stuck highlighted.
 */
export function EcosystemNodes({ paths, active, onHover }: Props) {
  return (
    <div className={styles.nodes}>
      {NODES.map((n, i) => {
        const { p } = paths[i];
        const dx = CX - p.x;
        const dy = CY - p.y;
        const len = Math.hypot(dx, dy) || 1;
        // Nodes on the top/bottom of the ring sit a touch further back than the side ones.
        const far = Math.abs(dy) > 150;
        const breathe = BREATHE.get(i);
        const vars = {
          left: `${(p.x / VIEW_W) * 100}%`,
          top: `${(p.y / VIEW_H) * 100}%`,
          "--d": `${nodeStart(n)}s`,
          "--fx": `${((dx / len) * 14).toFixed(1)}px`,
          "--fy": `${((dy / len) * 14).toFixed(1)}px`,
          "--s": far ? 0.96 : 1,
          "--bob": `${6.5 + (i % 4) * 0.7}s`,
          "--breathe": breathe === undefined ? undefined : `${breathe}s`,
        } as React.CSSProperties;
        const Icon = n.Icon;
        const slotCls = [styles.nodeSlot, active === i && styles.slotActive].filter(Boolean).join(" ");
        const nodeCls = [styles.node, active === i && styles.nodeActive, breathe !== undefined && styles.breathe].filter(Boolean).join(" ");
        return (
          <div key={n.label} className={slotCls} style={vars}>
            <div
              className={nodeCls}
              data-node={i}
              onPointerEnter={(e) => e.pointerType === "mouse" && onHover(i)}
              onPointerLeave={(e) => e.pointerType === "mouse" && onHover(null)}
            >
              <span className={styles.nodeIcon}>
                <Icon aria-hidden="true" strokeWidth={1.6} />
              </span>
              <span className={styles.nodeLabel}>{n.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
