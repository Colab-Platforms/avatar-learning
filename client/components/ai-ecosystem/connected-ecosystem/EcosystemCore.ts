// Three.js part of the About page ecosystem visual: the floating dark-glass
// AVATAR core plus a little ambient depth (soft halo, slow dust).
// Loaded with a dynamic import, so `three` only downloads on /adoption/about.
// The component drives it from its own requestAnimationFrame loop; nothing
// here touches React state.
import * as THREE from "three";

export interface CoreFrame {
  /** Seconds on the scene clock (paused while off-screen). */
  time: number;
  /** 0 → 1 core reveal. */
  reveal: number;
  /** Inner teal light, 0 → ~1.3. */
  glow: number;
  rotX: number;
  rotY: number;
  /** Core offset in CSS px (float + parallax); the logo overlay applies the same offset. */
  offsetX: number;
  offsetY: number;
  /** Background dust parallax in CSS px (kept tiny). */
  dustX: number;
  dustY: number;
}

export interface CoreHandle {
  setSize(width: number, height: number, coreFrac: number): void;
  render(frame: CoreFrame): void;
  dispose(): void;
}

const FOV = 30;
const CAM_Z = 10;
const CYAN = 0x58c4dc;
const TEAL = 0x16b8ac;

/** Rounded, pointy-top hexagon with circumradius 1. */
function roundedHex(radius = 1, corner = 0.2) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = Math.PI / 2 + (i * Math.PI) / 3;
    return new THREE.Vector2(Math.cos(a) * radius, Math.sin(a) * radius);
  });
  const shape = new THREE.Shape();
  pts.forEach((p, i) => {
    const prev = pts[(i + 5) % 6];
    const next = pts[(i + 1) % 6];
    const a = p.clone().lerp(prev, corner);
    const b = p.clone().lerp(next, corner);
    if (i === 0) shape.moveTo(a.x, a.y);
    else shape.lineTo(a.x, a.y);
    shape.quadraticCurveTo(p.x, p.y, b.x, b.y);
  });
  shape.closePath();
  return shape;
}

/** Soft round sprite for the halo / inner light / dust. */
function radialTexture(stops: [number, string][]) {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => grad.addColorStop(o, col));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

/** Returns null when WebGL is unavailable (the component then shows its static core). */
export function createEcosystemCore(canvas: HTMLCanvasElement, opts: { compact: boolean }): CoreHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !opts.compact, powerPreference: "low-power" });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.compact ? 1.5 : 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
  camera.position.set(0, 0, CAM_Z);

  // No environment map on purpose: a reflected "room" washes the flat face out
  // when it tilts. Highlights come only from these lights, mostly on the bevel.
  scene.add(new THREE.AmbientLight(0x9fb8c4, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(2.5, 3, 4);
  scene.add(key);
  const rimLight = new THREE.PointLight(CYAN, 7, 0, 2);
  rimLight.position.set(-2.2, 1.6, 2.2);
  scene.add(rimLight);
  const backLight = new THREE.PointLight(TEAL, 5, 0, 2);
  backLight.position.set(1.4, -1.2, -1.6);
  scene.add(backLight);

  const group = new THREE.Group();
  scene.add(group);

  // Glass body
  const shape = roundedHex();
  const depth = 0.3;
  const bevel = 0.07;
  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 6,
  });
  bodyGeo.center();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x0c171b,
    metalness: 0.15,
    roughness: 0.32,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
    emissive: new THREE.Color(0x0e3a3f),
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);
  const frontZ = depth / 2 + 0.08;

  // Thin cyan line round the front edge, a fainter one round the back.
  const outline = shape.getPoints(10).map((p) => new THREE.Vector3(p.x * 1.045, p.y * 1.045, 0));
  const rimGeo = new THREE.BufferGeometry().setFromPoints(outline);
  const rimMat = new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const rimFront = new THREE.LineLoop(rimGeo, rimMat);
  rimFront.position.z = frontZ - 0.035;
  group.add(rimFront);
  const rimBackMat = rimMat.clone();
  const rimBack = new THREE.LineLoop(rimGeo, rimBackMat);
  rimBack.position.z = -frontZ + 0.035;
  group.add(rimBack);

  // Soft teal light inside the glass (sits just in front of the face, additive).
  const innerTex = radialTexture([
    [0, "rgba(64,214,200,0.75)"],
    [0.45, "rgba(22,184,172,0.22)"],
    [1, "rgba(22,184,172,0)"],
  ]);
  const innerMat = new THREE.MeshBasicMaterial({ map: innerTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const planeGeo = new THREE.PlaneGeometry(1, 1);
  const inner = new THREE.Mesh(planeGeo, innerMat);
  inner.scale.setScalar(1.7);
  inner.position.z = frontZ + 0.002;
  group.add(inner);

  // Halo behind the core (ambient light on the panel).
  const haloTex = radialTexture([
    [0, "rgba(88,196,220,0.55)"],
    [0.35, "rgba(22,184,172,0.16)"],
    [1, "rgba(18,56,61,0)"],
  ]);
  const haloMat = new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const halo = new THREE.Mesh(planeGeo, haloMat);
  halo.scale.setScalar(4.6);
  halo.position.z = -0.9;
  scene.add(halo);

  // A few slow dust motes for depth (fewer on mobile; kept sparse on purpose).
  const dustCount = opts.compact ? 10 : 22;
  const dustPos = new Float32Array(dustCount * 3);
  const dustSeed = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() * 2 - 1) * 2.4;
    dustPos[i * 3 + 1] = (Math.random() * 2 - 1) * 2.7;
    dustPos[i * 3 + 2] = -2.5 + Math.random() * 2.2;
    dustSeed[i] = Math.random() * Math.PI * 2;
  }
  const dustBase = dustPos.slice();
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dustTex = radialTexture([
    [0, "rgba(200,245,250,1)"],
    [0.4, "rgba(88,196,220,0.5)"],
    [1, "rgba(88,196,220,0)"],
  ]);
  const dustMat = new THREE.PointsMaterial({ map: dustTex, size: 0.06, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  let pxPerUnit = 1;
  let coreScale = 1;

  return {
    setSize(width, height, coreFrac) {
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const visibleH = 2 * CAM_Z * Math.tan((FOV * Math.PI) / 360);
      pxPerUnit = height / visibleH;
      // Flat-to-flat width of the hex (incl. bevel) = √3 · (1 + bevel).
      coreScale = (coreFrac * width) / (Math.sqrt(3) * (1 + bevel) * pxPerUnit);
    },
    render({ time, reveal, glow, rotX, rotY, offsetX, offsetY, dustX, dustY }) {
      const r = ease(reveal);
      group.scale.setScalar(coreScale * (0.86 + 0.14 * r));
      // CSS y points down, world y points up.
      group.position.set(offsetX / pxPerUnit, -offsetY / pxPerUnit, 0);
      group.rotation.set(rotX, rotY, 0);
      dust.position.set(dustX / pxPerUnit, -dustY / pxPerUnit, 0);
      // Background light drifts very slowly (14 s cycle).
      const ambient = 0.5 + 0.5 * Math.sin((time / 14) * Math.PI * 2);
      bodyMat.opacity = r;
      bodyMat.emissiveIntensity = 0.12 + 0.3 * Math.min(1, glow);
      rimMat.opacity = r * (0.55 + 0.35 * Math.min(1, glow));
      rimBackMat.opacity = r * 0.18;
      innerMat.opacity = r * (0.18 + 0.32 * glow);
      haloMat.opacity = Math.min(1, reveal * 1.6) * (0.26 + 0.24 * glow + 0.08 * ambient);
      halo.scale.setScalar(coreScale * (4.1 + 0.2 * glow + 0.25 * ambient));
      halo.position.copy(group.position).setZ(-0.9);

      dustMat.opacity = 0.4 * Math.min(1, reveal * 1.2);
      for (let i = 0; i < dustCount; i++) {
        const s = dustSeed[i];
        dustPos[i * 3] = dustBase[i * 3] + Math.sin(time * 0.11 + s) * 0.12;
        dustPos[i * 3 + 1] = dustBase[i * 3 + 1] + Math.cos(time * 0.09 + s * 1.3) * 0.16;
      }
      dustGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    },
    dispose() {
      [bodyGeo, rimGeo, planeGeo, dustGeo].forEach((g) => g.dispose());
      [bodyMat, rimMat, rimBackMat, innerMat, haloMat, dustMat].forEach((m) => m.dispose());
      [innerTex, haloTex, dustTex].forEach((t) => t.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
