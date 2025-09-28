// @ts-ignore
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// Box removed; using inline overlay button

// A small, modular Tower-like color matching game using three.js
// - 8 pegs, 8 colors, max 4 disks per peg
// - click the top disk to select, then click a peg to move if empty or top color matches
// - after each successful move a new disk spawns (until capacity)
// - when a peg has 4 disks of the same color it is "completed" and awards points

type DiskData = {
  colorIndex: number;
  mesh: THREE.Mesh;
  peg: number;
};

const COLORS = [
  0xff6b6b, // red
  0xffb86b, // orange
  0xfff56b, // yellow
  0x8aff6b, // lime
  0x6bd1ff, // cyan
  0x8b6bff, // purple
  0xff6bf0, // magenta
  0x6bfff2, // teal
];
// game constants
const TARGET_PEGS = 8; // towers that should eventually be filled / represent colors
const AUX_PEGS = 2; // additional empty towers for maneuvering
const SPECIAL_PEGS = 1; // special single-slot tower
const PEG_COUNT = TARGET_PEGS + AUX_PEGS + SPECIAL_PEGS;
const MAX_PER_PEG = 4;

// Visual zoom configuration (tweak these to change how 'zoomed-in' the scene is)
// Touch devices: strongest zoom for very small screens, smaller for larger touch screens
// Visual zoom (how 'tight' the camera frustum is). Values >1 zoom in (objects appear larger).
// We use modest values so the towers don't get oversized. Tweak if needed.
const VISUAL_ZOOM_TOUCH_XS = 1.0;   // phones < 420px
const VISUAL_ZOOM_TOUCH_SM = 1.0;   // phones/tablets < 720px
const VISUAL_ZOOM_TOUCH_MD = 1.0;   // larger touch screens
// Desktop: minimal zoom (1.0 = no zoom)
const VISUAL_ZOOM_DESKTOP_SM = 1.0; // small desktop window
const VISUAL_ZOOM_DESKTOP_LG = 1.0; // large desktop window

// How much of the upper half-height to keep when applying the orthographic frustum.
// Lower values crop more empty sky above the towers. Setting this to 1.0
// disables the top crop so the camera includes the full content vertically.
const TOP_CROP_DEFAULT = 1.0;


function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const playTone = (freq: number, time = 0.08, type: OscillatorType = 'sine') => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    } catch (e) {
      // creating AudioContext may be blocked until a user gesture — silently no-op
      return;
    }
    const ctx = ctxRef.current!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    o.connect(g); g.connect(ctx.destination);
    g.gain.value = 0.001;
    const now = ctx.currentTime;
    g.gain.linearRampToValueAtTime(0.12, now + 0.005);
    o.start(now);
    g.gain.linearRampToValueAtTime(0.0001, now + time);
    o.stop(now + time + 0.02);
  };
  return { playTone };
}

export default function TowerGamePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rayRef = useRef<THREE.Raycaster | null>(null);
  const pointerRef = useRef<THREE.Vector2 | null>(null);
  const lastVisualZoomRef = useRef<number>(1);
  const messageTimerRef = useRef<number | null>(null);
  const debugDivRef = useRef<HTMLDivElement | null>(null);
  const computeLegalMovesRef = useRef<null | ((includeSpecial?: boolean) => Array<[number, number]>)>(null);
  const animateShakeRef = useRef<null | ((obj: THREE.Object3D, magnitude?: number, duration?: number) => void)>(null);
  const disksRef = useRef<DiskData[][]>([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  // helper to show a transient message without causing the page to jump/scroll
  function showTransientMessage(txt: string, duration = 900) {
    // Clear any outstanding timer so messages don't overlap and we always restore once
    if (messageTimerRef.current) {
      try { window.clearTimeout(messageTimerRef.current); } catch (e) {}
      messageTimerRef.current = null;
    }

    const body = document.body as HTMLBodyElement;
    const docEl = document.documentElement as any;
    const sx = window.scrollX || window.pageXOffset || 0;
    const sy = window.scrollY || window.pageYOffset || 0;

    // Save previous inline styles so we can restore them exactly
    const prevBodyPosition = body.style.position || '';
    const prevBodyTop = body.style.top || '';
    const prevBodyLeft = body.style.left || '';
    const prevBodyWidth = body.style.width || '';
    const prevDocScrollBehavior = docEl && docEl.style ? docEl.style.scrollBehavior : '';

    try {
      // Prevent layout-driven scroll jumps by fixing the body at the current scroll offset.
      // This is a robust technique to visually lock the page while DOM changes occur.
      body.style.position = 'fixed';
      body.style.top = `-${sy}px`;
      body.style.left = `-${sx}px`;
      body.style.width = '100%';
      if (docEl && docEl.style) docEl.style.scrollBehavior = 'auto';
    } catch (e) { /* ignore */ }

    setMessage(txt);

    // Schedule hide + restore
    const id = window.setTimeout(() => {
      setMessage(null);
      try {
        // restore body styles
        body.style.position = prevBodyPosition;
        body.style.top = prevBodyTop;
        body.style.left = prevBodyLeft;
        body.style.width = prevBodyWidth;
        if (docEl && docEl.style) docEl.style.scrollBehavior = prevDocScrollBehavior || '';
        // restore the scroll to the saved position (in case the browser changed it)
        window.scrollTo(sx, sy);
      } catch (e) { /* ignore */ }
      messageTimerRef.current = null;
    }, duration);
    messageTimerRef.current = id;
  }
  const selectedTowerRef = useRef<number | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [sealed, setSealed] = useState<boolean[]>([]);
  const { playTone } = useAudio();
  const sealedRef = useRef<boolean[]>([]);

  useEffect(() => {
    // prevent the page from scrolling while the game is mounted
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const container = containerRef.current!;
    // ensure the game container fills the remaining viewport height so the user
    // can interact without needing to scroll the page. We compute height as
    // window.innerHeight - containerTop - footerHeight (if present).
    const prevContainerPosition = container.style.position;
    const prevContainerHeight = container.style.height;
    const prevContainerOverflow = container.style.overflow;
    // top UI padding: try to detect a header element and reserve additional space so
    // the canvas doesn't align flush with the page header; fallback to a small default
    const TOP_UI_PADDING_DEFAULT = 8;
    function fitContainerToViewport() {
      try {
        const top = container.getBoundingClientRect().top || 0;
        const header = document.querySelector('header');
        const headerH = header ? header.getBoundingClientRect().height || 0 : TOP_UI_PADDING_DEFAULT;
        const footer = document.querySelector('footer');
        const footerH = footer ? footer.getBoundingClientRect().height || 0 : 0;
        // Subtract headerH to make room for top layout padding; for very thin screens
        // subtract a bit more so the content doesn't feel cramped vertically.
        const extraCompact = window.innerWidth < 420 ? 36 : 0;
        const target = Math.max(260, Math.floor(window.innerHeight - top - footerH - headerH - extraCompact));
        container.style.position = container.style.position || 'relative';
        container.style.height = `${target}px`;
        container.style.overflow = 'hidden';
      } catch (e) { /* ignore */ }
    }
    fitContainerToViewport();
    window.addEventListener('resize', fitContainerToViewport);

  const w = container.clientWidth || 800;
  const h = Math.max(400, container.clientHeight || 600);

  const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111019);
    sceneRef.current = scene;

    // Layout and sizing (responsive): baseSpacing is a world-unit spacing between columns.
    // We will place the 4 target columns at x = (-1.5, -0.5, 0.5, 1.5) * baseSpacing so the horizontal
    // content width is 3 * baseSpacing. The orthographic frustum is computed so this content fills the
    // viewport horizontally (with a small padding) regardless of viewport size.
  // const aspect = w / h; // unused now that frustum is set with explicit half-height
  // ratios derived from previous fixed layout to keep proportions
  const plateRadiusRatio = 1.4 / 5.4; // ~0.259
  const pegHeightRatio = 3.2 / 5.4; // ~0.593
  const diskRadiusRatio = 0.9 / 5.4; // ~0.167
  const diskThicknessRatio = 0.28 / 5.4; // ~0.052
  const stackSpacingRatio = 0.3 / 5.4; // vertical spacing per disk
  const depthSpacingRatio = 9 / 5.4; // spacingZ / spacingX ~1.666
  // shorten peg rods uniformly (1.0 = original, <1.0 = shorter)
  const ROD_HEIGHT_FACTOR = 0.55;

  // compute a baseSpacing (world-unit) such that the 4 columns fit the canvas width
  // and the vertical extent (stack height) fits within canvas height minus a bottom reserve for UI.
  const contentUnitFactor = 3 + 2 * plateRadiusRatio; // world units per baseSpacing horizontally
  const Vscale = (diskThicknessRatio / 2) + (MAX_PER_PEG - 1) * stackSpacingRatio; // vertical units per baseSpacing
  // make the plates a bit thinner in world units; this helps free vertical space
  const plateHeightConst = 0.05; // plate thickness in world units (constant)
  // increase horizontal padding so towers comfortably fit inside the view
  // (was 1.03) — widen a bit to avoid towers clipping at edge
  const paddingFactor = 1.24;

  // reserve more pixels at the bottom for UI (buttons, score, etc.) so the scene sits higher
  const bottomReservePx = Math.max(160, Math.round(h * 0.18));
  const availableHeightPx = Math.max(120, h - bottomReservePx);
  const rendererWidthPx = w;

  // Solve for baseSpacing s from inequality derived from projected vertical pixels:
  // projectedVerticalPx = rendererWidthPx * (plateHeight + s*Vscale) / (s * contentUnitFactor * paddingFactor)
  // We want projectedVerticalPx <= availableHeightPx. Rearranged, this gives:
  // plateHeight/s + Vscale <= availableHeightPx / A  where A = rendererWidthPx/(contentUnitFactor*paddingFactor)
  // => s >= plateHeight / (availableHeightPx/A - Vscale)
  let baseSpacing = 1;
  const A = rendererWidthPx / (contentUnitFactor * paddingFactor);
  const denom = (availableHeightPx / A) - Vscale;
  if (denom > 1e-6) {
    const sCalc = plateHeightConst / denom;
    baseSpacing = Math.max(0.35, Math.min(sCalc, 6));
  } else {
    // fallback: scale down modestly so layout stays usable
    baseSpacing = 0.6;
  }

  // detect touch early so we can bias initial sizing
  const isTouch = !!(navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || 'ontouchstart' in window;
  // Touch-device compacting: reduce spacing and proportions slightly on mobile so discs
  // appear slimmer and towers are closer together. Use a stronger reduction for very small screens.
  const minDim = Math.min(w, h);
  const TOUCH_COMPACT = isTouch ? (minDim < 420 ? 0.78 : minDim < 720 ? 0.86 : 0.92) : 1.0;
  baseSpacing = baseSpacing * TOUCH_COMPACT;

  const plateRadius = baseSpacing * plateRadiusRatio;
  // Reduce visible peg height slightly on touch so rods don't look too tall for the slimmer stacks
  const pegHeight = baseSpacing * pegHeightRatio * ROD_HEIGHT_FACTOR * (isTouch ? 0.85 : 1.0);
  // vertical layout helpers: plate sits at plateY and its top will be plateTop.
  const plateHeight = isTouch ? 0.034 : 0.05; // thinner plate on touch
  const plateY = 0.0; // center Y of plate (we use plateTop = plateY + plateHeight/2)
  const plateTop = plateY + (plateHeight / 2);
    
  const pegRadiusRatio = 0.18 / 5.4; // original ratio from fixed layout
  const pegRadius = baseSpacing * pegRadiusRatio;
  const diskRadius = baseSpacing * diskRadiusRatio;
  // Make disks thinner on touch devices so they don't look chunky
  const diskThickness = baseSpacing * diskThicknessRatio * (isTouch ? 0.55 : 1.0);
  // Slightly decrease stack spacing on touch for compact stacks
  const stackSpacing = baseSpacing * stackSpacingRatio * (isTouch ? 0.92 : 1.0);
    const spacingX = baseSpacing; // horizontal column spacing in world units
    const spacingZ = baseSpacing * depthSpacingRatio; // depth spacing between rows

  // desired content width (4 columns) = distance between outer column centers + plate radii on both sides
  const contentWidth = (3 * spacingX) + (2 * plateRadius);
    // compute frustum extents (half-width and half-height in world units) so we can tightly crop sky and ground
    function computeFrustumExtents(containerW: number, containerH: number) {
      const halfW = (contentWidth / 2) * paddingFactor;
      const topHeight = plateTop + (diskThickness / 2) + (MAX_PER_PEG - 1) * stackSpacing;
      const bottomHeight = plateY - (plateHeight / 2);
      const contentHeight = topHeight - bottomHeight;
      // map vertical extent into width-space for comparison with horizontal half-width
      const halfWFromVert = (contentHeight / 2) * (containerW / containerH) * paddingFactor;
      let halfWFinal = Math.max(halfW, halfWFromVert);
      const minDim = Math.min(containerW, containerH);
      // apply an extra compact factor for very narrow devices so objects look less chunky
      const EXTRA_NARROW_COMPACT = (isTouch && minDim < 360) ? 0.82 : 1.0;
      let visualZoom = isTouch ? (minDim < 420 ? VISUAL_ZOOM_TOUCH_XS : minDim < 720 ? VISUAL_ZOOM_TOUCH_SM : VISUAL_ZOOM_TOUCH_MD) : (minDim < 900 ? VISUAL_ZOOM_DESKTOP_SM : VISUAL_ZOOM_DESKTOP_LG);
      visualZoom = Math.max(1.0, visualZoom);
      visualZoom = visualZoom * EXTRA_NARROW_COMPACT;
      halfWFinal = halfWFinal / visualZoom;
      // half-height in world units after visual zoom
      const halfHFinal = (contentHeight / 2) * paddingFactor / visualZoom;
      return { halfW: halfWFinal, halfH: halfHFinal, visualZoom };
    }

  const extents = computeFrustumExtents(w, h);
  lastVisualZoomRef.current = extents.visualZoom;
    // compute orthographic frustum so content fits viewport (we'll set camera to look at content center)
    const camera = new THREE.OrthographicCamera(
      -extents.halfW, extents.halfW,
      extents.halfH, -extents.halfH,
      -100, 200
    );
    // We'll compute the content center and point the camera at that center so the three rows are centered in the canvas.
    function computeContentCenterAndPosition() {
      // pegPositions array contains x,z for each peg; vertical extents derive from plateY up to top of tallest stack
      const xs = pegPositions.map(p => p.x);
      const zs = pegPositions.map(p => p.z);
      const minX = Math.min(...xs); const maxX = Math.max(...xs);
      const minZ = Math.min(...zs); const maxZ = Math.max(...zs);
      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;
      const topHeight = plateTop + (diskThickness / 2) + (MAX_PER_PEG - 1) * stackSpacing;
      const bottomHeight = plateY - (plateHeight / 2);
      const centerY = (topHeight + bottomHeight) / 2;
  // place camera offset relative to the content bounding extents so scaling is consistent
  const contentW = maxX - minX;
  const contentZ = maxZ - minZ;
  const contentH = topHeight - bottomHeight;
  const contentRadius = Math.max(contentW, contentZ, contentH, 1.0);
  // factors tuned for a pleasant 2.5D perspective; tweak if necessary
  const CAM_Y_FACTOR = 1.7;
  const CAM_Z_FACTOR = 4.0;
  camera.position.set(centerX, centerY + contentRadius * CAM_Y_FACTOR, centerZ + contentRadius * CAM_Z_FACTOR);
  camera.lookAt(centerX, centerY, centerZ);
      // after positioning the camera, compute an orthographic frustum that tightly fits the content
      try {
        const topH = plateTop + (diskThickness / 2) + (MAX_PER_PEG - 1) * stackSpacing;
        const bottomH = plateY - (plateHeight / 2);
        const xs = pegPositions.map(p => p.x);
        const zs = pegPositions.map(p => p.z);
        const minX = Math.min(...xs); const maxX = Math.max(...xs);
        const minZ = Math.min(...zs); const maxZ = Math.max(...zs);
  computeAndApplyOrtho(camera, { minX, maxX, minZ, maxZ, minY: bottomH, maxY: topH }, paddingFactor, extents.visualZoom, TOP_CROP_DEFAULT);
      } catch (e) { /* ignore */ }
  }
    cameraRef.current = camera;

    // helper: compute orthographic bounds from world content bounds using camera-space projection
    function computeAndApplyOrtho(cam: THREE.Camera & { updateMatrixWorld: () => void }, bounds: { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number }, pad: number, visualZoomVal: number, topCrop = 1.0) {
      // ensure camera world matrix is up-to-date
      cam.updateMatrixWorld();
      const inv = new THREE.Matrix4().copy(cam.matrixWorld).invert();
      // build corner points of the content box
      const pts: THREE.Vector3[] = [];
      const xs = [bounds.minX, bounds.maxX];
      const ys = [bounds.minY, bounds.maxY];
      const zs = [bounds.minZ, bounds.maxZ];
      for (const x of xs) for (const y of ys) for (const z of zs) pts.push(new THREE.Vector3(x, y, z));
      // transform to camera space and find extents
      let minCx = Infinity, maxCx = -Infinity, minCy = Infinity, maxCy = -Infinity;
      for (const p of pts) {
        const pc = p.clone().applyMatrix4(inv);
        minCx = Math.min(minCx, pc.x); maxCx = Math.max(maxCx, pc.x);
        minCy = Math.min(minCy, pc.y); maxCy = Math.max(maxCy, pc.y);
      }
      const centerCx = (minCx + maxCx) / 2;
      const centerCy = (minCy + maxCy) / 2;
      const halfWcam = Math.max(Math.abs(maxCx - centerCx), Math.abs(centerCx - minCx)) * pad / Math.max(1, visualZoomVal);
      const halfHcam = Math.max(Math.abs(maxCy - centerCy), Math.abs(centerCy - minCy)) * pad / Math.max(1, visualZoomVal);
      // apply with optional top crop (reduce upper area)
      const top = halfHcam * topCrop;
      const bottom = -halfHcam;
      (cam as THREE.OrthographicCamera).left = -halfWcam;
      (cam as THREE.OrthographicCamera).right = halfWcam;
      (cam as THREE.OrthographicCamera).top = top;
      (cam as THREE.OrthographicCamera).bottom = bottom;
      (cam as THREE.OrthographicCamera).updateProjectionMatrix();
    }

  const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  // ensure canvas sits beneath overlay UI and fills container
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.zIndex = '0';
  // make touch interactions smooth on mobile
  renderer.domElement.style.touchAction = 'none';
    rendererRef.current = renderer;

    // debug overlay (enabled with ?debug in URL)
    const params = new URLSearchParams(window.location.search);
    const debugOn = params.has('debug');
    if (debugOn) {
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.left = '8px';
      div.style.top = '8px';
      div.style.padding = '8px 10px';
      div.style.background = 'rgba(0,0,0,0.6)';
      div.style.color = '#fff';
      div.style.fontSize = '12px';
      div.style.lineHeight = '1.3';
      div.style.zIndex = '9999';
      div.style.whiteSpace = 'pre';
      container.style.position = 'relative';
      container.appendChild(div);
      debugDivRef.current = div;
    }

    // lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(10, 20, 10);
    scene.add(dir);

    // ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 40),
      new THREE.MeshStandardMaterial({ color: 0x08080a })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

  // create pegs in 3 rows: two full rows of 4 each, and a third centered row for auxiliaries
  const pegGroup = new THREE.Group();
  const pegPositions: { x: number; z: number }[] = [];
    // first TARGET_PEGS are filled towers (8); arrange as 4 + 4 rows
    for (let i = 0; i < TARGET_PEGS; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4); // 0 or 1
      const x = (col - 1.5) * spacingX;
      // place target pegs in the top two rows: top = -spacingZ, second = 0
      const z = row === 0 ? -spacingZ : 0;
      pegPositions.push({ x, z });

      const peg = new THREE.Mesh(
        new THREE.CylinderGeometry(pegRadius, pegRadius, pegHeight, 12),
        new THREE.MeshStandardMaterial({ color: 0xf5f5f7 })
      );
      // position rod so its base sits on top of the plate
      peg.position.set(x, plateTop + (pegHeight / 2), z);
      peg.name = `peg-${i}`;
      peg.userData = { pegIndex: i };
      pegGroup.add(peg);

      const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(plateRadius, plateRadius, plateHeight, 32),
        new THREE.MeshStandardMaterial({ color: 0xdfe2e6, opacity: 0.85, transparent: true })
      );
      plate.position.set(x, plateY, z);
      plate.name = `plate-${i}`;
      plate.userData = { pegIndex: i, isPlate: true };
      pegGroup.add(plate);

      // add an invisible hit cylinder that covers only the stacked-disk area (MAX_PER_PEG)
      const hitRadius = plateRadius; // match plate radius
      const hitHeight = Math.min((MAX_PER_PEG * stackSpacing) + 0.4, pegHeight * 0.9);
      const hitMat = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, transparent: true });
      // do not write color/depth to avoid rendering artifacts while keeping the mesh raycastable
      (hitMat as any).colorWrite = false;
      (hitMat as any).depthWrite = false;
  const hitMesh = new THREE.Mesh(new THREE.CylinderGeometry(hitRadius, hitRadius, hitHeight, 12), hitMat);
  // position so cylinder base aligns near plateTop
  hitMesh.position.set(x, plateTop + (hitHeight / 2), z);
      hitMesh.name = `hit-${i}`;
      // keep it present for raycasting and mark peg index
      hitMesh.userData = { pegIndex: i };
      hitMesh.renderOrder = 0;
      pegGroup.add(hitMesh);
    }

    // third (final) row: centered three pegs at z = spacingZ
    // left two are auxiliary pegs, rightmost is the special single-slot peg
  const thirdZ = spacingZ;
    // aux 0: left (-spacingX), aux 1: center (0)
    for (let a = 0; a < AUX_PEGS; a++) {
      const i = TARGET_PEGS + a; // indices for auxiliaries
  const x = (a - 1) * spacingX; // a=0 -> -spacingX, a=1 -> 0
      const z = thirdZ;
      pegPositions.push({ x, z });

      const peg = new THREE.Mesh(
        new THREE.CylinderGeometry(pegRadius, pegRadius, pegHeight, 12),
        new THREE.MeshStandardMaterial({ color: 0xf5f5f7 })
      );
      peg.position.set(x, plateTop + (pegHeight / 2), z);
      peg.name = `peg-${i}`;
      peg.userData = { pegIndex: i };
      pegGroup.add(peg);

      const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(plateRadius, plateRadius, plateHeight, 32),
        new THREE.MeshStandardMaterial({ color: 0xdfe2e6, opacity: 0.85, transparent: true })
      );
      plate.position.set(x, plateY, z);
      plate.name = `plate-${i}`;
      plate.userData = { pegIndex: i, isPlate: true };
      pegGroup.add(plate);

      // invisible hit cylinder for auxiliaries (stack-height only)
      const hitRadiusAux = plateRadius;
      const hitHeightAux = Math.min((MAX_PER_PEG * stackSpacing) + 0.4, pegHeight * 0.9);
      const hitMatAux = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, transparent: true });
      // do not write color/depth to avoid rendering artifacts while keeping the mesh raycastable
      (hitMatAux as any).colorWrite = false;
      (hitMatAux as any).depthWrite = false;
      const hitMeshAux = new THREE.Mesh(new THREE.CylinderGeometry(hitRadiusAux, hitRadiusAux, hitHeightAux, 12), hitMatAux);
  hitMeshAux.position.set(x, plateTop + (hitHeightAux / 2), z);
      hitMeshAux.name = `hit-${i}`;
      hitMeshAux.userData = { pegIndex: i };
      hitMeshAux.renderOrder = 0;
      pegGroup.add(hitMeshAux);
    }

    // special peg: rightmost of the three (x = +spacingX)
    const specialIndex = TARGET_PEGS + AUX_PEGS; // last index
    const specialX = spacingX;
    const specialZ = thirdZ;
    pegPositions.push({ x: specialX, z: specialZ });
    // shorten visible special peg rod height so it visually fits single capacity
    // compute special rod height from the (already shortened) pegHeight so the ROD_HEIGHT_FACTOR
    // applies consistently. Keep a small minimum to avoid degenerate rods.
    const specialRodHeight = Math.max(pegHeight * 0.6, baseSpacing * 0.18);
    const specialPeg = new THREE.Mesh(
      new THREE.CylinderGeometry(pegRadius, pegRadius, specialRodHeight, 12),
      new THREE.MeshStandardMaterial({ color: 0xf5f5f7, opacity: 0.5, transparent: true })
    );
  specialPeg.position.set(specialX, plateTop + (specialRodHeight / 2), specialZ);
    specialPeg.name = `peg-${specialIndex}`;
    specialPeg.userData = { pegIndex: specialIndex, isSpecial: true };
    pegGroup.add(specialPeg);

    const specialPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(plateRadius, plateRadius, plateHeight, 32),
      new THREE.MeshStandardMaterial({ color: 0xbfd7ff, opacity: 0.35, transparent: true })
    );
  specialPlate.position.set(specialX, plateY, specialZ);
    specialPlate.name = `plate-${specialIndex}`;
    specialPlate.userData = { pegIndex: specialIndex, isPlate: true, isSpecial: true, isEnabled: false };
    pegGroup.add(specialPlate);

    // invisible hit cylinder for special peg (stack-height only)
  const hitRadiusSpecial = plateRadius;
  const hitHeightSpecial = Math.min((MAX_PER_PEG * stackSpacing) + 0.4, pegHeight * 0.9);
    const hitMatSpecial = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, transparent: true });
    // do not write color/depth to avoid rendering artifacts while keeping the mesh raycastable
    (hitMatSpecial as any).colorWrite = false;
    (hitMatSpecial as any).depthWrite = false;
    const hitMeshSpecial = new THREE.Mesh(new THREE.CylinderGeometry(hitRadiusSpecial, hitRadiusSpecial, hitHeightSpecial, 12), hitMatSpecial);
  hitMeshSpecial.position.set(specialX, plateTop + (hitHeightSpecial / 2), specialZ);
    hitMeshSpecial.name = `hit-${specialIndex}`;
    hitMeshSpecial.userData = { pegIndex: specialIndex };
    hitMeshSpecial.renderOrder = 0;
    pegGroup.add(hitMeshSpecial);

  (scene as any).userData.pegPositions = pegPositions;
    scene.add(pegGroup);
    // now that pegPositions exists, compute camera center
    computeContentCenterAndPosition();

    // raycaster setup
    const ray = new THREE.Raycaster();
    rayRef.current = ray;
    pointerRef.current = new THREE.Vector2();

    // track recent invalid tap to allow second-tap selection behavior
    const invalidAttemptRef = { current: null as { idx: number; time: number } | null };

    function handleInvalidTap(dest: number) {
      // sealed pegs stay blocked
      if (isPegSealed(dest)) {
        const plate = scene.getObjectByName(`plate-${dest}`) as THREE.Object3D | undefined;
        if (plate) animateShake(plate, 0.12, 200);
        playTone(220, 0.08, 'sine');
        showTransientMessage('This tower is sealed', 900);
        return false;
      }
      const now = Date.now();
      const prev = invalidAttemptRef.current;
      if (prev && prev.idx === dest && (now - prev.time) < 1500) {
        // second tap within window: allow selecting this tower (if it has disks)
        invalidAttemptRef.current = null;
        const arr = disksRef.current[dest];
        if (!arr || arr.length === 0) {
          playTone(220, 0.06, 'sine');
          showTransientMessage('No disks to select', 900);
          return false;
        }
        selectedTowerRef.current = dest;
        highlightPlate(dest);
        playTone(660 + (arr[arr.length - 1].colorIndex * 30), 0.06, 'square');
        return true;
      }
      // first invalid tap: shake and register
      const plate = scene.getObjectByName(`plate-${dest}`) as THREE.Object3D | undefined;
  if (plate) animateShake(plate, 0.12, 200);
      playTone(220, 0.14, 'sine');
      showTransientMessage('Invalid move - tap again to select', 1400);
      invalidAttemptRef.current = { idx: dest, time: now };
      setTimeout(() => { if (invalidAttemptRef.current && invalidAttemptRef.current.idx === dest) invalidAttemptRef.current = null; }, 1400);
      return false;
    }

    // disks data
    disksRef.current = Array.from({ length: PEG_COUNT }, () => []);

    // helper to create a disk mesh
    function createDiskMesh(colorHex: number) {
      const geo = new THREE.CylinderGeometry(diskRadius, diskRadius, diskThickness, 32);
      const mat = new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.12, roughness: 0.56 });
      const mesh = new THREE.Mesh(geo, mat);
      return mesh;
    }

    // initialize disks: we should have NUM_COLORS * MAX_PER_PEG total disks
    // per requirements, initially all disks are placed on the TARGET_PEGS (first row) with 4 of each color (random arrangement)
    const pegPositionsLocal = (scene as any).userData.pegPositions as { x: number; z: number }[];
    // build color pool: each color repeats MAX_PER_PEG times
    const colorPool: number[] = [];
    for (let c = 0; c < COLORS.length; c++) {
      for (let k = 0; k < MAX_PER_PEG; k++) colorPool.push(c);
    }
    // shuffle pool
    for (let i = colorPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = colorPool[i]; colorPool[i] = colorPool[j]; colorPool[j] = tmp;
    }
    // fill the TARGET_PEGS (first TARGET_PEGS indices) with 4 disks each by popping from pool
    let poolIdx = 0;
    for (let p = 0; p < TARGET_PEGS; p++) {
      for (let lvl = 0; lvl < MAX_PER_PEG; lvl++) {
        const colorIndex = colorPool[poolIdx++];
        const mesh = createDiskMesh(COLORS[colorIndex]);
        const pos = pegPositionsLocal[p];
  const y = plateTop + (diskThickness / 2) + lvl * stackSpacing;
        mesh.position.set(pos.x, y, pos.z);
        mesh.userData = { pegIndex: p, level: lvl };
        scene.add(mesh);
        disksRef.current[p].push({ colorIndex, mesh, peg: p });
      }
    }
    // auxiliary pegs (AUX_PEGS) remain empty initially

    // check whether a peg is completed (has MAX_PER_PEG all of same color)
    function checkCompleted(pegIndex: number) {
      const arr = disksRef.current[pegIndex];
      if (!arr || arr.length !== MAX_PER_PEG) return false;
      const first = arr[0].colorIndex;
      return arr.every(d => d.colorIndex === first);
    }

    function markCompletedIfNeeded(pegIndex: number) {
      if (checkCompleted(pegIndex)) {
  setScore(s => s + MAX_PER_PEG);
  showTransientMessage('Peg completed!', 1200);
  playTone(880, 0.15, 'triangle');
        const plate = scene.getObjectByName(`plate-${pegIndex}`) as THREE.Mesh | undefined;
        if (plate) {
          (plate.material as THREE.MeshStandardMaterial).color.setHex(0x9fe3a6);
          // add a glossy whitish overcoat overlay to indicate sealing
          // Create a glossy overcoat that covers the full height of the completed stack
          // Compute the world-space top of the completed stack and the required overlay height
          const stackTopY = plateTop + (diskThickness / 2) + (MAX_PER_PEG - 1) * stackSpacing;
          // Make the overlay slightly taller than the stack to ensure a clean visual cover
          const overlayHeight = Math.max(0.06, (stackTopY - plateTop) + 0.04);

          // translucent cylindrical shell that surrounds the stack
          const shell = new THREE.Mesh(
            new THREE.CylinderGeometry(plateRadius * 0.94, plateRadius * 0.94, overlayHeight, 24, 1, true),
            new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.08, metalness: 0.22, side: THREE.DoubleSide })
          );
          // position shell so its base roughly aligns with plateTop and it extends up to cover stackTopY
          shell.position.set(plate.position.x, plateTop + (overlayHeight / 2), plate.position.z + 0.001);
          shell.name = `overlay-${pegIndex}`;
          scene.add(shell);

          // add a small top-cap sheen for the very top of the stack
          const cap = new THREE.Mesh(
            new THREE.CircleGeometry(plateRadius * 0.96, 24),
            new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.2 })
          );
          cap.rotation.x = -Math.PI / 2;
          // place cap slightly above the stack top for a highlight
          cap.position.set(plate.position.x, stackTopY + 0.02, plate.position.z + 0.002);
          cap.name = `overlay-cap-${pegIndex}`;
          scene.add(cap);
        }
        // seal the peg so its disks cannot be moved
        sealedRef.current[pegIndex] = true;
        setSealed([...sealedRef.current]);
        setTimeout(() => {
          const completed = disksRef.current.reduce((c, _arr, idx) => c + (checkCompleted(idx) ? 1 : 0), 0);
          setCompletedCount(completed);
          // after sealing/completion, determine if special peg should be enabled
          updateSpecialEnabled();
        }, 80);
      }
    }

    // helper: capacity per peg (special peg has single slot)
    function capacityFor(pegIndex: number) {
      const plateObj = scene.getObjectByName(`plate-${pegIndex}`) as any;
      if (plateObj && plateObj.userData && plateObj.userData.isSpecial) return 1;
      return MAX_PER_PEG;
    }

    function isPegSealed(pegIndex: number) {
      return !!sealedRef.current[pegIndex];
    }

    

    // Compute list of legal moves (sourceIndex -> destIndex). Optionally include special peg moves depending on flag.
    function computeLegalMoves(includeSpecial = false) {
      const moves: Array<[number, number]> = [];
      for (let s = 0; s < PEG_COUNT; s++) {
        if (isPegSealed(s)) continue;
        const srcArr = disksRef.current[s];
        if (!srcArr || srcArr.length === 0) continue;
        const movingColor = srcArr[srcArr.length - 1].colorIndex;
        for (let d = 0; d < PEG_COUNT; d++) {
          if (d === s) continue;
          if (isPegSealed(d)) continue;
          const plate = scene.getObjectByName(`plate-${d}`) as any;
          const isSpecial = plate && plate.userData && plate.userData.isSpecial;
          if (isSpecial && !includeSpecial) continue;
          const destArr = disksRef.current[d];
          const cap = capacityFor(d);
          if (destArr.length >= cap) continue;
          if (isSpecial && includeSpecial) {
            // special accepts any disk when includeSpecial===true
            moves.push([s, d]);
            continue;
          }
          if (destArr.length === 0) { moves.push([s, d]); continue; }
          const destTop = destArr[destArr.length - 1];
          if (destTop.colorIndex === movingColor) moves.push([s, d]);
        }
      }
      return moves;
    }

    // (previous meaningfulMovesExist helper removed - enabling now uses computeLegalMoves directly)

    function updateSpecialEnabled() {
      // Once the special peg becomes enabled, it should remain enabled for the rest of the game.
      // Strategy:
      // 1) If there are absolutely no non-special legal moves, enable the special peg (true dead-end).
      // 2) Otherwise pick a representative legal move (first), simulate it on an in-memory copy
      //    of the stacks, compute the next set of legal moves (still excluding special), and
      //    only enable the special peg if all resulting moves are strictly between the same
      //    two pegs (i.e. the simulated source and destination). This avoids enabling the
      //    special peg when the next moves open up other towers.
      const specialPlateObj = scene.getObjectByName(`plate-${specialIndex}`) as any;
      if (!specialPlateObj) return;
      const currently = !!specialPlateObj.userData.isEnabled;

      // Immediate dead-end: enable if there are no non-special legal moves
      const legal = computeLegalMoves(false);
      if (legal.length === 0 && !currently) {
        specialPlateObj.userData.isEnabled = true;
        (specialPlateObj.material as THREE.MeshStandardMaterial).opacity = 0.9;
        return;
      }

      if (currently) return; // already enabled; do nothing

      // If there are legal moves, check whether all of the current legal moves only
      // involve a small set of pegs (size <= 2). If so, simulate each candidate move
      // and ensure the simulated next moves don't introduce any new pegs outside that
      // original small set. This handles back-and-forth/hint-move cycles.
      if (legal.length > 0) {
        // For each legal candidate, simulate that move and compute the set of pegs
        // involved in the simulated next moves. Require that for every candidate,
        // the simulated next moves are strictly confined to that candidate's two
        // pegs (src and dst). This allows multiple independent to-and-fro pairs to
        // exist simultaneously and still enable the special peg.
        let allCandidatesRestricted = true;
        for (const candidate of legal) {
          const [cSrc, cDst] = candidate;
          const simStacks: number[][] = disksRef.current.map(arr => arr.map(d => d.colorIndex));
          const moved = simStacks[cSrc].pop();
          if (moved === undefined) { allCandidatesRestricted = false; break; }
          simStacks[cDst].push(moved);

          const simInvolved = new Set<number>();
          for (let s = 0; s < PEG_COUNT; s++) {
            if (sealedRef.current[s]) continue;
            const srcArr = simStacks[s];
            if (!srcArr || srcArr.length === 0) continue;
            const movingColor = srcArr[srcArr.length - 1];
            for (let d = 0; d < PEG_COUNT; d++) {
              if (d === s) continue;
              if (sealedRef.current[d]) continue;
              const plate = scene.getObjectByName(`plate-${d}`) as any;
              const isSpecial = plate && plate.userData && plate.userData.isSpecial;
              if (isSpecial) continue;
              const destArr = simStacks[d];
              const cap = (plate && plate.userData && plate.userData.isSpecial) ? 1 : MAX_PER_PEG;
              if (destArr.length >= cap) continue;
              if (destArr.length === 0) { simInvolved.add(s); simInvolved.add(d); continue; }
              const destTop = destArr[destArr.length - 1];
              if (destTop === movingColor) { simInvolved.add(s); simInvolved.add(d); }
            }
          }

          // If simulation produced no moves, not a stable repetitive pair
          if (simInvolved.size === 0) { allCandidatesRestricted = false; break; }

          // Ensure every involved peg is either cSrc or cDst
          for (const p of simInvolved) {
            if (p !== cSrc && p !== cDst) { allCandidatesRestricted = false; break; }
          }
          if (!allCandidatesRestricted) break;
        }

        if (allCandidatesRestricted) {
          specialPlateObj.userData.isEnabled = true;
          (specialPlateObj.material as THREE.MeshStandardMaterial).opacity = 0.9;
          return;
        }
        // Fallback: simulate the first candidate and require that the simulated moves
        // are strictly between that candidate's src and dst (the older behavior).
        const candidate = legal[0];
        if (!candidate) return;
        const [src, dst] = candidate;
        const simStacks: number[][] = disksRef.current.map(arr => arr.map(d => d.colorIndex));
        const moved = simStacks[src].pop();
        if (moved === undefined) return;
        simStacks[dst].push(moved);

        const simMoves: Array<[number, number]> = [];
        for (let s = 0; s < PEG_COUNT; s++) {
          if (sealedRef.current[s]) continue;
          const srcArr = simStacks[s];
          if (!srcArr || srcArr.length === 0) continue;
          const movingColor = srcArr[srcArr.length - 1];
          for (let d = 0; d < PEG_COUNT; d++) {
            if (d === s) continue;
            if (sealedRef.current[d]) continue;
            const plate = scene.getObjectByName(`plate-${d}`) as any;
            const isSpecial = plate && plate.userData && plate.userData.isSpecial;
            if (isSpecial) continue;
            const destArr = simStacks[d];
            const cap = (plate && plate.userData && plate.userData.isSpecial) ? 1 : MAX_PER_PEG;
            if (destArr.length >= cap) continue;
            if (destArr.length === 0) { simMoves.push([s, d]); continue; }
            const destTop = destArr[destArr.length - 1];
            if (destTop === movingColor) simMoves.push([s, d]);
          }
        }
        if (simMoves.length === 0) return;
        const onlyBetweenSameTwo = simMoves.every(([a, b]) => (a === src && b === dst) || (a === dst && b === src));
        if (onlyBetweenSameTwo) {
          specialPlateObj.userData.isEnabled = true;
          (specialPlateObj.material as THREE.MeshStandardMaterial).opacity = 0.9;
        }
      }
      // intentionally do NOT disable the special peg once enabled
    }

    // animate a mesh from current position to target (returns a Promise)
    function animateMove(mesh: THREE.Object3D, toPos: { x: number; y: number; z: number }, duration = 220) {
      return new Promise<void>(resolve => {
        const from = mesh.position.clone();
        const start = performance.now();
        function frame() {
          const t = Math.min(1, (performance.now() - start) / duration);
          // simple easeOutQuad
          const tt = 1 - (1 - t) * (1 - t);
          mesh.position.set(
            from.x + (toPos.x - from.x) * tt,
            from.y + (toPos.y - from.y) * tt,
            from.z + (toPos.z - from.z) * tt
          );
          if (t < 1) requestAnimationFrame(frame); else resolve();
        }
        requestAnimationFrame(frame);
      });
    }

    // visual highlight for selected plate
    function highlightPlate(pegIndex: number | null) {
      for (let i = 0; i < PEG_COUNT; i++) {
        const plate = scene.getObjectByName(`plate-${i}`) as THREE.Mesh | undefined;
        if (plate) {
          (plate.material as THREE.MeshStandardMaterial).color.setHex(0xdfe2e6);
        }
      }
      if (pegIndex === null) return;
      const p = scene.getObjectByName(`plate-${pegIndex}`) as THREE.Mesh | undefined;
      if (p) (p.material as THREE.MeshStandardMaterial).color.setHex(0xa6c8ff);
    }

    // small shake animation for an object (reduced default magnitude for gentler vibration)
    function animateShake(obj: THREE.Object3D, magnitude = 0.12, duration = 200) {
      const start = performance.now();
      const baseX = obj.position.x;
      function frame() {
        const t = performance.now() - start;
        if (t > duration) { obj.position.x = baseX; return; }
        const phase = Math.sin((t / duration) * Math.PI * 6) * (1 - t / duration);
        obj.position.x = baseX + phase * magnitude;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

  // expose helpers for use by UI outside the effect
  computeLegalMovesRef.current = computeLegalMoves;
  animateShakeRef.current = animateShake;

    // initialize sealed array and check completed pegs on next frame
    sealedRef.current = Array.from({ length: PEG_COUNT }, () => false);
    setSealed([...sealedRef.current]);
    setTimeout(() => {
      const completed = disksRef.current.reduce((c, _arr, idx) => c + (checkCompleted(idx) ? 1 : 0), 0);
      setCompletedCount(completed);
      // ensure special peg is set correctly on startup
      updateSpecialEnabled();
    }, 80);

    // simple animation loop
    let rafId: number;
    function animate() {
      rafId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
      // update debug overlay if present
      const dbg = debugDivRef.current;
      if (dbg) {
        const cam = camera as THREE.OrthographicCamera;
        const lines: string[] = [];
        lines.push(`cam.pos=${cam.position.x.toFixed(2)},${cam.position.y.toFixed(2)},${cam.position.z.toFixed(2)}`);
        lines.push(`ortho=L${cam.left.toFixed(2)} R${cam.right.toFixed(2)} T${cam.top.toFixed(2)} B${cam.bottom.toFixed(2)}`);
        lines.push(`visualZoom=${lastVisualZoomRef.current.toFixed(2)} topCrop=${TOP_CROP_DEFAULT}`);
        // compute approximate content extents and tower/view boundaries
        try {
          const xs = pegPositions.map(p => p.x);
          const zs = pegPositions.map(p => p.z);
          const minX = Math.min(...xs), maxX = Math.max(...xs);
          const minZ = Math.min(...zs), maxZ = Math.max(...zs);
          const topH = plateTop + (diskThickness / 2) + (MAX_PER_PEG - 1) * stackSpacing;
          const bottomH = plateY - (plateHeight / 2);
          lines.push(`contentX=${(maxX - minX).toFixed(2)} Z=${(maxZ - minZ).toFixed(2)} H=${(topH - bottomH).toFixed(2)}`);
          // tower outer edges (include plate radius)
          const leftTowerEdge = (minX - plateRadius).toFixed(2);
          const rightTowerEdge = (maxX + plateRadius).toFixed(2);
          lines.push(`towerEdges L=${leftTowerEdge} R=${rightTowerEdge}`);
          // compute world coordinates of camera frustum corners (camera-space -> world)
          const camWorld = cam.matrixWorld;
          const tl = new THREE.Vector3(cam.left, cam.top, 0).applyMatrix4(camWorld);
          const tr = new THREE.Vector3(cam.right, cam.top, 0).applyMatrix4(camWorld);
          const bl = new THREE.Vector3(cam.left, cam.bottom, 0).applyMatrix4(camWorld);
          const br = new THREE.Vector3(cam.right, cam.bottom, 0).applyMatrix4(camWorld);
          lines.push(`viewLeft=${tl.x.toFixed(2)} viewRight=${tr.x.toFixed(2)} brX=${br.x.toFixed(2)}`);
          lines.push(`viewTop=${tl.y.toFixed(2)} viewBottom=${bl.y.toFixed(2)} brY=${br.y.toFixed(2)}`);
        } catch (e) { /* ignore */ }
        dbg.textContent = lines.join('\n');
      }
    }
    animate();

    // pointer events
    // Try to get peg index from direct mesh ray intersection (peg rod or plate). If none, fall back to ground-based nearest peg.
    function getPegIndexFromPointer(clientX: number, clientY: number, maxRadius = 2.4) {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      pointerRef.current!.set(x, y);
      ray.setFromCamera(pointerRef.current!, camera);

      // first try direct mesh hit (peg rod or plate)
      const allMeshes: THREE.Object3D[] = [];
      scene.traverse((o: THREE.Object3D) => {
        if ((o as THREE.Mesh).isMesh && (o.userData && typeof (o.userData.pegIndex) === 'number')) allMeshes.push(o);
      });
      const hits = ray.intersectObjects(allMeshes, true);
      if (hits && hits.length > 0) {
        const firstHit = hits[0].object as any;
        if (firstHit.userData && typeof firstHit.userData.pegIndex === 'number') return firstHit.userData.pegIndex as number;
      }

      // If no direct mesh hit, check whether the ray passes near any peg center (within plate radius)
      // This allows selecting the tower rod area (empty air above the plate) within the plate diameter.
  const selectionRadius = Math.max(plateRadius, 0.9); // use computed plateRadius (fallback to reasonable value)
      const origin = ray.ray.origin.clone();
      const dir = ray.ray.direction.clone().normalize();
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let i = 0; i < pegPositionsLocal.length; i++) {
        const p = pegPositionsLocal[i];
        const pegPos = new THREE.Vector3(p.x, 0, p.z);
        const v = pegPos.clone().sub(origin);
        const t = v.dot(dir);
        const closest = new THREE.Vector3();
        if (t <= 0) closest.copy(origin); else closest.copy(dir).multiplyScalar(t).add(origin);
        const d = pegPos.distanceTo(closest);
  if (d <= selectionRadius && d < bestDist) { bestDist = d; bestIdx = i; }
      }
      if (bestIdx !== -1) return bestIdx;

      // fallback: intersect with ground plane and pick nearest peg by world distance
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      if (ray.ray.intersectPlane(groundPlane, intersection)) {
        // nearest peg by pegPositionsLocal
        let best = -1;
        let bestD = Infinity;
        for (let i = 0; i < pegPositionsLocal.length; i++) {
          const p = pegPositionsLocal[i];
          const dx = p.x - intersection.x;
          const dz = p.z - intersection.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < bestD) { bestD = d; best = i; }
        }
        if (best !== -1 && bestD <= maxRadius) return best;
      }
      return null;
    }
    let animating = false;
    async function onPointer(e: PointerEvent) {
      if (animating) return;
      const pegIndex = getPegIndexFromPointer(e.clientX, e.clientY);
      if (pegIndex === null) return;

      const src = selectedTowerRef.current;
      const dest = pegIndex;
      // if nothing selected yet: select this tower if it has at least one disk and is not sealed
      if (src === null) {
        if (isPegSealed(dest)) {
          playTone(220, 0.08, 'sine');
          showTransientMessage('This tower is sealed and cannot be moved', 900);
          return;
        }
        if (disksRef.current[dest].length === 0) {
          // selecting empty tower is allowed but doesn't pick a disk
          playTone(220, 0.05, 'sine');
          showTransientMessage('Select a tower with disks to move', 800);
          return;
        }
        selectedTowerRef.current = dest;
        highlightPlate(dest);
        playTone(660 + (disksRef.current[dest][disksRef.current[dest].length - 1].colorIndex * 30), 0.06, 'square');
        return;
      }

      // if same tower clicked, deselect
      if (dest === src) {
        selectedTowerRef.current = null;
        highlightPlate(null);
        return;
      }

      // attempt move from src to dest with grouped-top-disk behavior
      if (isPegSealed(src)) {
        playTone(220, 0.08, 'sine');
  showTransientMessage('Source tower is sealed', 800);
        selectedTowerRef.current = null; highlightPlate(null); return;
      }
      if (isPegSealed(dest)) {
        playTone(220, 0.08, 'sine');
  showTransientMessage('Destination tower is sealed', 800);
        selectedTowerRef.current = null; highlightPlate(null); return;
      }
      const sourceArr = disksRef.current[src];
      if (!sourceArr || sourceArr.length === 0) {
        playTone(220, 0.05, 'sine');
        selectedTowerRef.current = null; highlightPlate(null); return;
      }

      // compute contiguous same-color disks from the top of source
      function contiguousTopCount(pegIndex: number) {
        const arr = disksRef.current[pegIndex];
        if (!arr || arr.length === 0) return 0;
        let cnt = 1;
        const topColor = arr[arr.length - 1].colorIndex;
        for (let i = arr.length - 2; i >= 0; i--) {
          if (arr[i].colorIndex === topColor) cnt++; else break;
        }
        return cnt;
      }

      const targetArr = disksRef.current[dest];
      const plateDest = scene.getObjectByName(`plate-${dest}`) as any;
      const destIsSpecial = plateDest && plateDest.userData && plateDest.userData.isSpecial;
      const destTop = targetArr[targetArr.length - 1];

      // check base invalid cases: special disabled (read enabled flag from plate.userData to avoid stale closure)
      const specialPlateFlag = plateDest && plateDest.userData && plateDest.userData.isEnabled;
      if (destIsSpecial && !specialPlateFlag) {
        if (handleInvalidTap(dest)) return; else return;
      }
      // If dest is non-special and has a top that doesn't match source top, invalid move
      const sourceTopColor = sourceArr[sourceArr.length - 1].colorIndex;
      if (!destIsSpecial && targetArr.length > 0 && destTop.colorIndex !== sourceTopColor) {
        if (handleInvalidTap(dest)) return; else return;
      }

      // compute how many to move: contiguous same-color on source, limited by dest capacity
      const contiguous = contiguousTopCount(src);
      const destCap = capacityFor(dest) - targetArr.length;
      const countToMove = Math.min(contiguous, Math.max(0, destCap));
      if (countToMove <= 0) {
        if (handleInvalidTap(dest)) return; else return;
      }

      // splice the top `countToMove` disks from source (returns array bottom-first among moving group)
      const movingDisks = sourceArr.splice(sourceArr.length - countToMove, countToMove);
      const pos = pegPositionsLocal[dest];
      // push them onto destination in bottom-first order, updating levels and peg references
      for (let i = 0; i < movingDisks.length; i++) {
        const disk = movingDisks[i];
        const newLevel = targetArr.length + i;
        disk.mesh.userData.pegIndex = dest;
        disk.mesh.userData.level = newLevel;
        disk.peg = dest;
        targetArr.push(disk);
      }

      // animate all disks concurrently to their target y positions
      animating = true;
      playTone(440 + sourceTopColor * 40, 0.06, 'sine');
      const moves = movingDisks.map((disk, i) => {
        const targetIndex = targetArr.length - movingDisks.length + i; // bottom-first
        const y = plateTop + (diskThickness / 2) + targetIndex * stackSpacing;
        return animateMove(disk.mesh, { x: pos.x, y, z: pos.z }, 260 + i * 20);
      });
      await Promise.all(moves);
      animating = false;

      // finalize selection and UI
      selectedTowerRef.current = null;
      highlightPlate(null);
      markCompletedIfNeeded(dest);
      markCompletedIfNeeded(src);
      updateSpecialEnabled();
    }

    renderer.domElement.addEventListener('pointerdown', onPointer as any);

    function onResize() {
      const w2 = container.clientWidth || 800;
      const h2 = Math.max(300, container.clientHeight || 320);
      const aspect2 = w2 / h2;

      // Recompute baseSpacing so the 4 target columns (3 * spacingX + 2*plateRadius) fit horizontally with padding
      // We'll infer baseSpacing from the current renderer pixel width and desired world-space content width.
      // Content in world units: contentWidth = 3 * spacingX + 2 * plateRadius = baseSpacing * (3 + 2*plateRadiusRatio)
  const plateRadiusRatio = 1.4 / 5.4; // same ratio used earlier
      // compute an approximate baseSpacing so contentWidth * padding maps to world frustum half-width
  const paddingFactor2 = 1.24;
      // we want halfWidth = (contentWidth/2)*paddingFactor2 -> choose baseSpacing so halfWidth corresponds to viewport units
      // solve for baseSpacing such that halfWidth / aspect2 maps similarly to camera top value; simpler: scale previous halfWidth by viewport
  // base spacing heuristic: scale with the smaller screen dimension so disks/towers are larger on mobile
  const minDim = Math.min(w2, h2);
  // increase baseline and clamp so objects are larger by default
  let baseSpacing2 = Math.max(0.6, Math.min((minDim / 360) * 1.2, 3.6));
  // detect touch devices and increase sizes for touch targets
  if (isTouch && minDim < 1100) {
    // stronger increase for touch devices so hit areas are generous
    baseSpacing2 = Math.min(baseSpacing2 * 1.5, 5.0);
  }
  const spacingX2 = baseSpacing2;
  const plateRadius2 = baseSpacing2 * plateRadiusRatio;
  const contentWidth2 = (3 * spacingX2) + (2 * plateRadius2);
  let halfWidth2 = (function() {
        // compute content width and height in world units for current baseSpacing2
        const contentWidthWorld = contentWidth2;
        const topHeight = plateTop + (diskThickness / 2) + (MAX_PER_PEG - 1) * stackSpacing;
        const bottomHeight = plateY - (plateHeight / 2);
        const contentHeightWorld = topHeight - bottomHeight;
        const halfW_horiz = (contentWidthWorld / 2) * paddingFactor2;
        const halfW_vert = (contentHeightWorld / 2) * aspect2 * paddingFactor2;
        return Math.max(halfW_horiz, halfW_vert);
      })();
      // visual zoom matching computeFrustumHalfWidth
      const minDim2 = Math.min(w2, h2);
  let visualZoom2 = isTouch ? (minDim2 < 420 ? VISUAL_ZOOM_TOUCH_XS : minDim2 < 720 ? VISUAL_ZOOM_TOUCH_SM : VISUAL_ZOOM_TOUCH_MD) : (minDim2 < 900 ? VISUAL_ZOOM_DESKTOP_SM : VISUAL_ZOOM_DESKTOP_LG);
      visualZoom2 = Math.max(1.0, visualZoom2);
  lastVisualZoomRef.current = visualZoom2;
      halfWidth2 = halfWidth2 / visualZoom2;

      // Instead of assigning raw half-width/top values here (which would overwrite
      // any earlier 'topCrop' adjustments), compute orthographic extents from the
      // world-space content bounds and apply them via computeAndApplyOrtho so the
      // topCrop and visualZoom parameters are respected.
      const xs = pegPositions.map(p => p.x);
      const zs = pegPositions.map(p => p.z);
      const minX = Math.min(...xs); const maxX = Math.max(...xs);
      const minZ = Math.min(...zs); const maxZ = Math.max(...zs);
      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;
      const topHeight = plateTop + (diskThickness / 2) + (MAX_PER_PEG - 1) * stackSpacing;
      const bottomHeight = plateY - (plateHeight / 2);
      // bias the vertical center slightly downward so there's less empty sky above towers on desktop
      const contentHeight = topHeight - bottomHeight;
      const centerY = bottomHeight + contentHeight * 0.44;
  // compute content extents and derive camera offsets from them so sizing doesn't depend on baseSpacing heuristics
  const contentW2 = maxX - minX;
  const contentZ2 = maxZ - minZ;
  const contentH2 = topHeight - bottomHeight;
  const contentRadius2 = Math.max(contentW2, contentZ2, contentH2, 1.0);
  const CAM_Y_FACTOR2 = isTouch ? 1.2 : 1.7;
  const CAM_Z_FACTOR2 = isTouch ? 2.9 : 4.0;
  camera.position.set(centerX, centerY + contentRadius2 * CAM_Y_FACTOR2, centerZ + contentRadius2 * CAM_Z_FACTOR2);
  camera.lookAt(centerX, centerY, centerZ);

      // apply orthographic frustum derived from exact content bounds so topCrop takes effect
      // use the shared TOP_CROP_DEFAULT so changing that value affects both initial layout and resize
      try {
        computeAndApplyOrtho(camera, { minX, maxX, minZ, maxZ, minY: bottomHeight, maxY: topHeight }, paddingFactor2, visualZoom2, TOP_CROP_DEFAULT);
      } catch (e) { /* ignore if something isn't ready yet */ }
      renderer.setSize(w2, h2);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      ground.rotation.x = -Math.PI / 2;
    }
    window.addEventListener('resize', onResize);

  // run resize once to ensure initial camera/frustum is computed to fit the canvas
  try { onResize(); } catch (e) { /* ignore */ }
  // run sizing again on next frame after layout has settled
  requestAnimationFrame(() => { try { fitContainerToViewport(); onResize(); } catch (e) { } });
  // also apply a very short deferred sizing in case fonts or layout shift after mount
  setTimeout(() => { try { fitContainerToViewport(); onResize(); } catch (e) { } }, 80);

    // cleanup
    return () => {
      cancelAnimationFrame(rafId);
      renderer.domElement.removeEventListener('pointerdown', onPointer as any);
      window.removeEventListener('resize', onResize);
      // remove the viewport-fit listener we added and restore container styles
      window.removeEventListener('resize', fitContainerToViewport);
      try {
        container.style.position = prevContainerPosition;
        container.style.height = prevContainerHeight;
        container.style.overflow = prevContainerOverflow;
      } catch (e) { /* ignore */ }
      renderer.dispose();
      scene.traverse((o: THREE.Object3D) => {
        const mesh = o as THREE.Mesh;
        if (mesh && (mesh as any).isMesh) {
          if (mesh.geometry) mesh.geometry.dispose?.();
          if (mesh.material) {
            const m = mesh.material as any;
            if (Array.isArray(m)) m.forEach((mm: any) => mm.dispose?.()); else m.dispose?.();
          }
        }
      });
      container.removeChild(renderer.domElement);
      // restore document overflow
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // mark some state variables as used so the compiler/linter won't complain; they are updated during gameplay
  void score; void message; void completedCount; void sealed;

  // Hint action: find a legal move and shake the source + dest plates
  function showHint() {
    try {
      const moves = computeLegalMovesRef.current ? computeLegalMovesRef.current(false) : [];
      if (!moves || moves.length === 0) {
  showTransientMessage('No moves available', 1200);
        return;
      }
      // pick a random legal move to hint
      const [s, d] = moves[Math.floor(Math.random() * moves.length)];
      const scene = sceneRef.current;
      const animateShake = animateShakeRef.current;
      const srcPlate = scene ? scene.getObjectByName(`plate-${s}`) as THREE.Object3D | undefined : undefined;
      const dstPlate = scene ? scene.getObjectByName(`plate-${d}`) as THREE.Object3D | undefined : undefined;
  if (srcPlate && animateShake) animateShake(srcPlate, 0.12, 220);
  if (dstPlate && animateShake) animateShake(dstPlate, 0.12, 220);
      playTone(660, 0.08, 'sine');
    } catch (e) {
  showTransientMessage('No hint available', 1200);
    }
  }

  // Reset action: reload the page to fully reinitialize the scene and state
  function resetGame() {
    try {
      playTone(240, 0.06, 'sine');
      showTransientMessage('Resetting...', 400);
    } catch (e) { /* ignore */ }
    // short delay so message and tone are perceived before reload
    setTimeout(() => {
      try { window.location.reload(); } catch (e) { /* ignore */ }
    }, 420);
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', background: '#000', touchAction: 'none' }}>

        {/* Left-bottom overlay: score, message, and final Good Job! */}
        <div style={{ position: 'absolute', left: 12, bottom: 12, zIndex: 10000, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start', pointerEvents: 'none' }}>
          {/* score box: visually present but don't intercept pointer events so towers remain clickable */}
          <div style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.36)', color: '#fff', minWidth: 110, textAlign: 'left', pointerEvents: 'none' }}>
            <div style={{ fontSize: 13, opacity: 0.85 }}>Score</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{score}</div>
          </div>
          {message ? (
            <div style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.36)', color: '#fff', pointerEvents: 'none' }}>{message}</div>
          ) : null}
          {completedCount >= TARGET_PEGS ? (
            <div style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(102,187,106,0.85)', color: '#042', fontWeight: 700, pointerEvents: 'none' }}>Good Job!</div>
          ) : null}
        </div>

        {/* Right-bottom overlay: reset + hint buttons */}
        <div style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 10000, display: 'flex', gap: 8, flexDirection: 'column' }}>
          <button onClick={resetGame} style={{ padding: '6px 8px', borderRadius: 6, background: '#7a2b2b', color: '#fff', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: '13px' }}>Reset</button>
          <button onClick={showHint} style={{ padding: '6px 8px', borderRadius: 6, background: '#2b3a4a', color: '#fff', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: '13px' }}>Hints</button>
        </div>

      </div>
    </div>
  );
}
