import * as THREE from 'three';

const COLORS = [
  0xff6b6b, 0xffb86b, 0xfff56b, 0x8aff6b,
  0x6bd1ff, 0x8b6bff, 0xff6bf0, 0x6bfff2,
];

const TARGET_PEGS = 8;
const AUX_PEGS = 2;
const SPECIAL_PEGS = 1;
const PEG_COUNT = TARGET_PEGS + AUX_PEGS + SPECIAL_PEGS;
const MAX_PER_PEG = 4;
const TOP_CROP_DEFAULT = 1.0;

type DiskData = { colorIndex: number; mesh: THREE.Mesh; peg: number };

export function initGame(container: HTMLElement) {
  const scoreEl = container.querySelector<HTMLElement>('#tower-score')!;
  const msgEl = container.querySelector<HTMLElement>('#tower-msg')!;
  const doneEl = container.querySelector<HTMLElement>('#tower-done')!;

  let score = 0;
  let msgTimer: number | null = null;

  function showTransientMessage(txt: string, duration = 900) {
    if (msgTimer) window.clearTimeout(msgTimer);
    const body = document.body;
    const sx = window.scrollX;
    const sy = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      width: body.style.width,
    };
    body.style.position = 'fixed';
    body.style.top = `-${sy}px`;
    body.style.left = `-${sx}px`;
    body.style.width = '100%';

    msgEl.textContent = txt;
    msgEl.hidden = false;

    msgTimer = window.setTimeout(() => {
      msgEl.hidden = true;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.width = prev.width;
      window.scrollTo(sx, sy);
      msgTimer = null;
    }, duration);
  }

  function resetGame() {
    playTone(240, 0.06, 'sine');
    showTransientMessage('Resetting...', 400);
    setTimeout(() => window.location.reload(), 420);
  }

  function showHint() {
    const moves = computeLegalMoves(false);
    if (!moves.length) return showTransientMessage('No moves available', 1200);
    const [s, d] = moves[Math.floor(Math.random() * moves.length)];
    const srcPlate = scene.getObjectByName(`plate-${s}`);
    const dstPlate = scene.getObjectByName(`plate-${d}`);
    if (srcPlate) animateShake(srcPlate, 0.12, 220);
    if (dstPlate) animateShake(dstPlate, 0.12, 220);
    playTone(660, 0.08, 'sine');
  }

  container.querySelector('#tower-reset')!.addEventListener('click', resetGame);
  container.querySelector('#tower-hint')!.addEventListener('click', showHint);

  let audioCtx: AudioContext | null = null;
  function playTone(freq: number, time = 0.08, type: OscillatorType = 'sine') {
    try {
      audioCtx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return;
    }
    const o = audioCtx!.createOscillator();
    const g = audioCtx!.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    g.connect(audioCtx!.destination);
    g.gain.value = 0.001;
    const now = audioCtx!.currentTime;
    g.gain.linearRampToValueAtTime(0.12, now + 0.005);
    o.start(now);
    g.gain.linearRampToValueAtTime(0.0001, now + time);
    o.stop(now + time + 0.02);
  }

  document.body.style.overflow = 'hidden';

  const isTouch = !!(navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || 'ontouchstart' in window;

  function fitContainerToViewport() {
    try {
      const top = container.getBoundingClientRect().top || 0;
      const header = document.querySelector('header');
      const headerH = header ? header.getBoundingClientRect().height || 0 : 8;
      const footer = document.querySelector('footer');
      const footerH = footer ? footer.getBoundingClientRect().height || 0 : 0;
      const extraCompact = window.innerWidth < 420 ? 36 : 0;
      const vv = (window as any).visualViewport as VisualViewport | undefined;
      const viewportH = vv && typeof vv.height === 'number' ? Math.min(window.innerHeight, vv.height) : window.innerHeight;
      const initialSafeMargin = window.innerWidth < 720 && isTouch ? 56 : 0;
      const target = Math.max(260, Math.floor(viewportH - top - footerH - headerH - extraCompact - initialSafeMargin));
      container.style.position = container.style.position || 'relative';
      container.style.height = `${target}px`;
      container.style.overflow = 'hidden';
    } catch {}
  }
  fitContainerToViewport();
  window.addEventListener('resize', fitContainerToViewport);

  const w = container.clientWidth || 800;
  const h = Math.max(400, container.clientHeight || 600);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111019);

  const plateRadiusRatio = 1.4 / 5.4;
  const pegHeightRatio = 3.2 / 5.4;
  const diskRadiusRatio = 0.9 / 5.4;
  const diskThicknessRatio = 0.28 / 5.4;
  const stackSpacingRatio = 0.3 / 5.4;
  const depthSpacingRatio = 9 / 5.4;
  const ROD_HEIGHT_FACTOR = 0.55;

  const contentUnitFactor = 3 + 2 * plateRadiusRatio;
  const Vscale = diskThicknessRatio / 2 + (MAX_PER_PEG - 1) * stackSpacingRatio;
  const plateHeightConst = 0.05;
  const paddingFactor = 1.24;

  const bottomReservePx = Math.max(160, Math.round(h * 0.18));
  const availableHeightPx = Math.max(120, h - bottomReservePx);
  const rendererWidthPx = w;

  let baseSpacing = 1;
  const A = rendererWidthPx / (contentUnitFactor * paddingFactor);
  const denom = availableHeightPx / A - Vscale;
  baseSpacing = denom > 1e-6 ? Math.max(0.35, Math.min(plateHeightConst / denom, 6)) : 0.6;

  const minDim = Math.min(w, h);
  const TOUCH_COMPACT = isTouch ? (minDim < 420 ? 0.78 : minDim < 720 ? 0.86 : 0.92) : 1.0;
  baseSpacing *= TOUCH_COMPACT;

  const plateRadius = baseSpacing * plateRadiusRatio;
  const pegHeight = baseSpacing * pegHeightRatio * ROD_HEIGHT_FACTOR * (isTouch ? 0.85 : 1.0);
  const plateHeight = isTouch ? 0.034 : 0.05;
  const plateY = 0.0;
  const plateTop = plateY + plateHeight / 2;

  const pegRadius = baseSpacing * (0.18 / 5.4);
  const diskRadius = baseSpacing * diskRadiusRatio;
  const diskThickness = baseSpacing * diskThicknessRatio * (isTouch ? 0.55 : 1.0);
  const stackSpacing = baseSpacing * stackSpacingRatio * (isTouch ? 0.92 : 1.0);
  const spacingX = baseSpacing;
  const spacingZ = baseSpacing * depthSpacingRatio;

  const contentWidth = 3 * spacingX + 2 * plateRadius;

  function computeFrustumExtents(containerW: number, containerH: number) {
    const halfW = (contentWidth / 2) * paddingFactor;
    const topHeight = plateTop + diskThickness / 2 + (MAX_PER_PEG - 1) * stackSpacing;
    const bottomHeight = plateY - plateHeight / 2;
    const contentHeight = topHeight - bottomHeight;
    const halfWFromVert = (contentHeight / 2) * (containerW / containerH) * paddingFactor;
    let halfWFinal = Math.max(halfW, halfWFromVert);
    const md = Math.min(containerW, containerH);
    const EXTRA_NARROW_COMPACT = isTouch && md < 360 ? 0.82 : 1.0;
    const visualZoom =
      (isTouch ? (md < 420 ? 1.0 : md < 720 ? 1.0 : 1.0) : md < 900 ? 1.0 : 1.0) * EXTRA_NARROW_COMPACT;
    halfWFinal = halfWFinal / Math.max(1.0, visualZoom);
    const halfHFinal = ((contentHeight / 2) * paddingFactor) / Math.max(1.0, visualZoom);
    return { halfW: halfWFinal, halfH: halfHFinal, visualZoom };
  }

  const extents = computeFrustumExtents(w, h);
  let lastVisualZoom = extents.visualZoom;

  const camera = new THREE.OrthographicCamera(-extents.halfW, extents.halfW, extents.halfH, -extents.halfH, -100, 200);

  const pegPositions: { x: number; z: number }[] = [];

  function computeAndApplyOrtho(cam: THREE.OrthographicCamera, bounds: { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number }, pad: number, visualZoomVal: number, topCrop = 1.0) {
    cam.updateMatrixWorld();
    const inv = new THREE.Matrix4().copy(cam.matrixWorld).invert();
    const pts: THREE.Vector3[] = [];
    for (const x of [bounds.minX, bounds.maxX])
      for (const y of [bounds.minY, bounds.maxY])
        for (const z of [bounds.minZ, bounds.maxZ]) pts.push(new THREE.Vector3(x, y, z));
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
    cam.left = -halfWcam;
    cam.right = halfWcam;
    cam.top = halfHcam * topCrop;
    cam.bottom = -halfHcam;
    cam.updateProjectionMatrix();
  }

  function computeContentCenterAndPosition() {
    const xs = pegPositions.map((p) => p.x);
    const zs = pegPositions.map((p) => p.z);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);
    const topHeight = plateTop + diskThickness / 2 + (MAX_PER_PEG - 1) * stackSpacing;
    const bottomHeight = plateY - plateHeight / 2;
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const centerY = (topHeight + bottomHeight) / 2;
    const contentRadius = Math.max(maxX - minX, maxZ - minZ, topHeight - bottomHeight, 1.0);
    camera.position.set(centerX, centerY + contentRadius * 1.7, centerZ + contentRadius * 4.0);
    camera.lookAt(centerX, centerY, centerZ);
    computeAndApplyOrtho(camera, { minX, maxX, minZ, maxZ, minY: bottomHeight, maxY: topHeight }, paddingFactor, lastVisualZoom, TOP_CROP_DEFAULT);
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.zIndex = '0';
  renderer.domElement.style.touchAction = 'none';

  const params = new URLSearchParams(window.location.search);
  const debugOn = params.has('debug');
  let debugDiv: HTMLDivElement | null = null;
  if (debugOn) {
    debugDiv = document.createElement('div');
    debugDiv.style.cssText = 'position:absolute;left:8px;top:8px;padding:8px 10px;background:rgba(0,0,0,0.6);color:#fff;font-size:12px;line-height:1.3;z-index:9999;white-space:pre';
    container.appendChild(debugDiv);
  }

  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.7);
  dir.position.set(10, 20, 10);
  scene.add(dir);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 40),
    new THREE.MeshStandardMaterial({ color: 0x08080a }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  scene.add(ground);

  const pegGroup = new THREE.Group();

  function makePeg(x: number, z: number, i: number, isSpecial = false) {
    const rodH = isSpecial ? Math.max(pegHeight * 0.6, baseSpacing * 0.18) : pegHeight;
    const peg = new THREE.Mesh(
      new THREE.CylinderGeometry(pegRadius, pegRadius, rodH, 12),
      new THREE.MeshStandardMaterial({ color: 0xf5f5f7, opacity: isSpecial ? 0.5 : 1, transparent: isSpecial }),
    );
    peg.position.set(x, plateTop + rodH / 2, z);
    peg.name = `peg-${i}`;
    peg.userData = { pegIndex: i, isSpecial };
    pegGroup.add(peg);

    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(plateRadius, plateRadius, plateHeight, 32),
      new THREE.MeshStandardMaterial({
        color: isSpecial ? 0xbfd7ff : 0xdfe2e6,
        opacity: isSpecial ? 0.35 : 0.85,
        transparent: true,
      }),
    );
    plate.position.set(x, plateY, z);
    plate.name = `plate-${i}`;
    plate.userData = { pegIndex: i, isPlate: true, isSpecial, isEnabled: !isSpecial };
    pegGroup.add(plate);

    const hitMat = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, transparent: true });
    (hitMat as any).colorWrite = false;
    (hitMat as any).depthWrite = false;
    const hitHeight = Math.min(MAX_PER_PEG * stackSpacing + 0.4, pegHeight * 0.9);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(plateRadius, plateRadius, hitHeight, 12), hitMat);
    hit.position.set(x, plateTop + hitHeight / 2, z);
    hit.name = `hit-${i}`;
    hit.userData = { pegIndex: i };
    pegGroup.add(hit);
  }

  for (let i = 0; i < TARGET_PEGS; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = (col - 1.5) * spacingX;
    const z = row === 0 ? -spacingZ : 0;
    pegPositions.push({ x, z });
    makePeg(x, z, i);
  }

  for (let a = 0; a < AUX_PEGS; a++) {
    const i = TARGET_PEGS + a;
    const x = (a - 1) * spacingX;
    pegPositions.push({ x, z: spacingZ });
    makePeg(x, spacingZ, i);
  }

  const specialIndex = TARGET_PEGS + AUX_PEGS;
  pegPositions.push({ x: spacingX, z: spacingZ });
  makePeg(spacingX, spacingZ, specialIndex, true);

  scene.userData.pegPositions = pegPositions;
  scene.add(pegGroup);
  computeContentCenterAndPosition();

  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const disks: DiskData[][] = Array.from({ length: PEG_COUNT }, () => []);

  function createDiskMesh(colorHex: number) {
    return new THREE.Mesh(
      new THREE.CylinderGeometry(diskRadius, diskRadius, diskThickness, 32),
      new THREE.MeshStandardMaterial({ color: colorHex, metalness: 0.12, roughness: 0.56 }),
    );
  }

  const colorPool: number[] = [];
  for (let c = 0; c < COLORS.length; c++) for (let k = 0; k < MAX_PER_PEG; k++) colorPool.push(c);
  for (let i = colorPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colorPool[i], colorPool[j]] = [colorPool[j], colorPool[i]];
  }
  let poolIdx = 0;
  for (let p = 0; p < TARGET_PEGS; p++) {
    for (let lvl = 0; lvl < MAX_PER_PEG; lvl++) {
      const colorIndex = colorPool[poolIdx++];
      const mesh = createDiskMesh(COLORS[colorIndex]);
      const pos = pegPositions[p];
      mesh.position.set(pos.x, plateTop + diskThickness / 2 + lvl * stackSpacing, pos.z);
      mesh.userData = { pegIndex: p, level: lvl };
      scene.add(mesh);
      disks[p].push({ colorIndex, mesh, peg: p });
    }
  }

  const sealed = Array.from({ length: PEG_COUNT }, () => false);

  function checkCompleted(pegIndex: number) {
    const arr = disks[pegIndex];
    if (!arr || arr.length !== MAX_PER_PEG) return false;
    return arr.every((d) => d.colorIndex === arr[0].colorIndex);
  }

  function markCompletedIfNeeded(pegIndex: number) {
    if (!checkCompleted(pegIndex)) return;
    score += MAX_PER_PEG;
    scoreEl.textContent = String(score);
    showTransientMessage('Peg completed!', 1200);
    playTone(880, 0.15, 'triangle');
    const plate = scene.getObjectByName(`plate-${pegIndex}`) as THREE.Mesh | undefined;
    if (plate) {
      (plate.material as THREE.MeshStandardMaterial).color.setHex(0x9fe3a6);
      const stackTopY = plateTop + diskThickness / 2 + (MAX_PER_PEG - 1) * stackSpacing;
      const overlayHeight = Math.max(0.06, stackTopY - plateTop + 0.04);
      const shell = new THREE.Mesh(
        new THREE.CylinderGeometry(plateRadius * 0.94, plateRadius * 0.94, overlayHeight, 24, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.08, metalness: 0.22, side: THREE.DoubleSide }),
      );
      shell.position.set(plate.position.x, plateTop + overlayHeight / 2, plate.position.z + 0.001);
      scene.add(shell);
      const cap = new THREE.Mesh(
        new THREE.CircleGeometry(plateRadius * 0.96, 24),
        new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.2 }),
      );
      cap.rotation.x = -Math.PI / 2;
      cap.position.set(plate.position.x, stackTopY + 0.02, plate.position.z + 0.002);
      scene.add(cap);
    }
    sealed[pegIndex] = true;
    setTimeout(() => {
      const completed = disks.reduce((c, _arr, idx) => c + (checkCompleted(idx) ? 1 : 0), 0);
      doneEl.hidden = completed < TARGET_PEGS;
      updateSpecialEnabled();
    }, 80);
  }

  function capacityFor(pegIndex: number) {
    const plate = scene.getObjectByName(`plate-${pegIndex}`) as any;
    if (plate?.userData?.isSpecial) return 1;
    return MAX_PER_PEG;
  }

  function isPegSealed(pegIndex: number) {
    return !!sealed[pegIndex];
  }

  function specialPlateEnabled() {
    const plate = scene.getObjectByName(`plate-${specialIndex}`) as any;
    return plate?.userData?.isEnabled === true;
  }

  function setSpecialEnabled() {
    const plate = scene.getObjectByName(`plate-${specialIndex}`) as any;
    if (!plate) return;
    plate.userData.isEnabled = true;
    plate.material.opacity = 0.9;
  }

  function computeLegalMoves(includeSpecial = false) {
    const moves: Array<[number, number]> = [];
    for (let s = 0; s < PEG_COUNT; s++) {
      if (isPegSealed(s)) continue;
      const srcArr = disks[s];
      if (!srcArr || srcArr.length === 0) continue;
      const movingColor = srcArr[srcArr.length - 1].colorIndex;
      for (let d = 0; d < PEG_COUNT; d++) {
        if (d === s || isPegSealed(d)) continue;
        const destIsSpecial = d === specialIndex;
        if (destIsSpecial && !includeSpecial) continue;
        const destArr = disks[d];
        if (destArr.length >= capacityFor(d)) continue;
        if (destIsSpecial && includeSpecial) { moves.push([s, d]); continue; }
        if (destArr.length === 0) { moves.push([s, d]); continue; }
        if (destArr[destArr.length - 1].colorIndex === movingColor) moves.push([s, d]);
      }
    }
    return moves;
  }

  function updateSpecialEnabled() {
    if (specialPlateEnabled()) return;
    const legal = computeLegalMoves(false);
    if (legal.length === 0) { setSpecialEnabled(); return; }
    let allRestricted = true;
    for (const candidate of legal) {
      const [cSrc, cDst] = candidate;
      const sim = disks.map((arr) => arr.map((d) => d.colorIndex));
      const moved = sim[cSrc].pop();
      if (moved === undefined) { allRestricted = false; break; }
      sim[cDst].push(moved);
      const involved = new Set<number>();
      for (let s = 0; s < PEG_COUNT; s++) {
        if (sealed[s]) continue;
        const arr = sim[s];
        if (!arr.length) continue;
        const mc = arr[arr.length - 1];
        for (let d = 0; d < PEG_COUNT; d++) {
          if (d === s || sealed[d] || d === specialIndex) continue;
          const destArr = sim[d];
          if (destArr.length >= MAX_PER_PEG) continue;
          if (destArr.length === 0) { involved.add(s); involved.add(d); continue; }
          if (destArr[destArr.length - 1] === mc) { involved.add(s); involved.add(d); }
        }
      }
      if (involved.size === 0) { allRestricted = false; break; }
      for (const p of involved) {
        if (p !== cSrc && p !== cDst) { allRestricted = false; break; }
      }
      if (!allRestricted) break;
    }
    if (allRestricted) { setSpecialEnabled(); return; }
    const [src, dst] = legal[0];
    const sim = disks.map((arr) => arr.map((d) => d.colorIndex));
    const moved = sim[src].pop();
    if (moved === undefined) return;
    sim[dst].push(moved);
    const simMoves: Array<[number, number]> = [];
    for (let s = 0; s < PEG_COUNT; s++) {
      if (sealed[s]) continue;
      const arr = sim[s];
      if (!arr.length) continue;
      const mc = arr[arr.length - 1];
      for (let d = 0; d < PEG_COUNT; d++) {
        if (d === s || sealed[d] || d === specialIndex) continue;
        const destArr = sim[d];
        if (destArr.length >= MAX_PER_PEG) continue;
        if (destArr.length === 0) { simMoves.push([s, d]); continue; }
        if (destArr[destArr.length - 1] === mc) simMoves.push([s, d]);
      }
    }
    if (!simMoves.length) return;
    const onlyBetweenSameTwo = simMoves.every(([a, b]) => (a === src && b === dst) || (a === dst && b === src));
    if (onlyBetweenSameTwo) setSpecialEnabled();
  }

  function animateMove(mesh: THREE.Object3D, toPos: { x: number; y: number; z: number }, duration = 220) {
    return new Promise<void>((resolve) => {
      const from = mesh.position.clone();
      const start = performance.now();
      function frame() {
        const t = Math.min(1, (performance.now() - start) / duration);
        const tt = 1 - (1 - t) * (1 - t);
        mesh.position.set(
          from.x + (toPos.x - from.x) * tt,
          from.y + (toPos.y - from.y) * tt,
          from.z + (toPos.z - from.z) * tt,
        );
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
  }

  function highlightPlate(pegIndex: number | null) {
    for (let i = 0; i < PEG_COUNT; i++) {
      const plate = scene.getObjectByName(`plate-${i}`) as THREE.Mesh | undefined;
      if (plate) (plate.material as THREE.MeshStandardMaterial).color.setHex(0xdfe2e6);
    }
    if (pegIndex === null) return;
    const p = scene.getObjectByName(`plate-${pegIndex}`) as THREE.Mesh | undefined;
    if (p) (p.material as THREE.MeshStandardMaterial).color.setHex(0xa6c8ff);
  }

  function animateShake(obj: THREE.Object3D, magnitude = 0.12, duration = 200) {
    const start = performance.now();
    const baseX = obj.position.x;
    function frame() {
      const t = performance.now() - start;
      if (t > duration) { obj.position.x = baseX; return; }
      obj.position.x = baseX + Math.sin((t / duration) * Math.PI * 6) * (1 - t / duration) * magnitude;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  setTimeout(() => {
    const completed = disks.reduce((c, _arr, idx) => c + (checkCompleted(idx) ? 1 : 0), 0);
    doneEl.hidden = completed < TARGET_PEGS;
    updateSpecialEnabled();
  }, 80);

  let rafId: number;
  function animate() {
    rafId = requestAnimationFrame(animate);
    renderer.render(scene, camera);
    if (debugDiv) {
      const cam = camera as THREE.OrthographicCamera;
      const xs = pegPositions.map((p) => p.x);
      const zs = pegPositions.map((p) => p.z);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minZ = Math.min(...zs), maxZ = Math.max(...zs);
      const topH = plateTop + diskThickness / 2 + (MAX_PER_PEG - 1) * stackSpacing;
      const bottomH = plateY - plateHeight / 2;
      debugDiv.textContent = [
        `cam=${cam.position.x.toFixed(2)},${cam.position.y.toFixed(2)},${cam.position.z.toFixed(2)}`,
        `ortho=L${cam.left.toFixed(2)} R${cam.right.toFixed(2)} T${cam.top.toFixed(2)} B${cam.bottom.toFixed(2)}`,
        `content=${(maxX - minX).toFixed(2)}x${(topH - bottomH).toFixed(2)} zoom=${lastVisualZoom.toFixed(2)}`,
      ].join('\n');
    }
  }
  animate();

  function getPegIndexFromPointer(clientX: number, clientY: number, maxRadius = 2.4) {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    pointer.set(x, y);
    ray.setFromCamera(pointer, camera);

    const allMeshes: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && typeof (o.userData as any).pegIndex === 'number') allMeshes.push(o);
    });
    const hits = ray.intersectObjects(allMeshes, true);
    if (hits.length > 0) return hits[0].object.userData.pegIndex as number;

    const selectionRadius = Math.max(plateRadius, 0.9);
    const origin = ray.ray.origin.clone();
    const dir = ray.ray.direction.clone().normalize();
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < pegPositions.length; i++) {
      const p = pegPositions[i];
      const pegPos = new THREE.Vector3(p.x, 0, p.z);
      const v = pegPos.clone().sub(origin);
      const t = v.dot(dir);
      const closest = t <= 0 ? origin.clone() : dir.clone().multiplyScalar(t).add(origin);
      const d = pegPos.distanceTo(closest);
      if (d <= selectionRadius && d < bestDist) { bestDist = d; bestIdx = i; }
    }
    if (bestIdx !== -1) return bestIdx;

    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    if (ray.ray.intersectPlane(groundPlane, intersection)) {
      let best = -1;
      let bestD = Infinity;
      for (let i = 0; i < pegPositions.length; i++) {
        const p = pegPositions[i];
        const d = Math.hypot(p.x - intersection.x, p.z - intersection.z);
        if (d < bestD) { bestD = d; best = i; }
      }
      if (best !== -1 && bestD <= maxRadius) return best;
    }
    return null;
  }

  let animating = false;
  let selectedTower: number | null = null;
  let invalidAttempt: { idx: number; time: number } | null = null;

  function handleInvalidTap(dest: number) {
    if (isPegSealed(dest)) {
      const plate = scene.getObjectByName(`plate-${dest}`);
      if (plate) animateShake(plate, 0.12, 200);
      playTone(220, 0.08, 'sine');
      showTransientMessage('This tower is sealed', 900);
      return false;
    }
    const now = Date.now();
    const prev = invalidAttempt;
    if (prev && prev.idx === dest && now - prev.time < 1500) {
      invalidAttempt = null;
      const arr = disks[dest];
      if (!arr || arr.length === 0) {
        playTone(220, 0.06, 'sine');
        showTransientMessage('No disks to select', 900);
        return false;
      }
      selectedTower = dest;
      highlightPlate(dest);
      playTone(660 + arr[arr.length - 1].colorIndex * 30, 0.06, 'square');
      return true;
    }
    const plate = scene.getObjectByName(`plate-${dest}`);
    if (plate) animateShake(plate, 0.12, 200);
    playTone(220, 0.14, 'sine');
    showTransientMessage('Invalid move - tap again to select', 1400);
    invalidAttempt = { idx: dest, time: now };
    setTimeout(() => {
      if (invalidAttempt?.idx === dest) invalidAttempt = null;
    }, 1400);
    return false;
  }

  function contiguousTopCount(pegIndex: number) {
    const arr = disks[pegIndex];
    if (!arr || arr.length === 0) return 0;
    let cnt = 1;
    const topColor = arr[arr.length - 1].colorIndex;
    for (let i = arr.length - 2; i >= 0; i--) {
      if (arr[i].colorIndex === topColor) cnt++;
      else break;
    }
    return cnt;
  }

  async function onPointer(e: PointerEvent) {
    if (animating) return;
    const dest = getPegIndexFromPointer(e.clientX, e.clientY);
    if (dest === null) return;
    const src = selectedTower;

    if (src === null) {
      if (isPegSealed(dest)) {
        playTone(220, 0.08, 'sine');
        showTransientMessage('This tower is sealed and cannot be moved', 900);
        return;
      }
      if (disks[dest].length === 0) {
        playTone(220, 0.05, 'sine');
        showTransientMessage('Select a tower with disks to move', 800);
        return;
      }
      selectedTower = dest;
      highlightPlate(dest);
      playTone(660 + disks[dest][disks[dest].length - 1].colorIndex * 30, 0.06, 'square');
      return;
    }

    if (dest === src) {
      selectedTower = null;
      highlightPlate(null);
      return;
    }

    if (isPegSealed(src) || isPegSealed(dest)) {
      playTone(220, 0.08, 'sine');
      showTransientMessage('Tower is sealed', 800);
      selectedTower = null;
      highlightPlate(null);
      return;
    }

    const sourceArr = disks[src];
    if (!sourceArr || sourceArr.length === 0) {
      playTone(220, 0.05, 'sine');
      selectedTower = null;
      highlightPlate(null);
      return;
    }

    const destIsSpecial = dest === specialIndex;
    if (destIsSpecial && !specialPlateEnabled()) {
      handleInvalidTap(dest);
      return;
    }

    const sourceTopColor = sourceArr[sourceArr.length - 1].colorIndex;
    const targetArr = disks[dest];
    if (!destIsSpecial && targetArr.length > 0 && targetArr[targetArr.length - 1].colorIndex !== sourceTopColor) {
      handleInvalidTap(dest);
      return;
    }

    const destCap = capacityFor(dest) - targetArr.length;
    const countToMove = Math.min(contiguousTopCount(src), Math.max(0, destCap));
    if (countToMove <= 0) {
      handleInvalidTap(dest);
      return;
    }

    const movingDisks = sourceArr.splice(sourceArr.length - countToMove, countToMove);
    const pos = pegPositions[dest];
    for (let i = 0; i < movingDisks.length; i++) {
      const disk = movingDisks[i];
      const newLevel = targetArr.length + i;
      disk.mesh.userData.pegIndex = dest;
      disk.mesh.userData.level = newLevel;
      disk.peg = dest;
      targetArr.push(disk);
    }

    animating = true;
    playTone(440 + sourceTopColor * 40, 0.06, 'sine');
    const moves = movingDisks.map((disk, i) => {
      const targetIndex = targetArr.length - movingDisks.length + i;
      const y = plateTop + diskThickness / 2 + targetIndex * stackSpacing;
      return animateMove(disk.mesh, { x: pos.x, y, z: pos.z }, 260 + i * 20);
    });
    await Promise.all(moves);
    animating = false;

    selectedTower = null;
    highlightPlate(null);
    markCompletedIfNeeded(dest);
    markCompletedIfNeeded(src);
    updateSpecialEnabled();
  }

  renderer.domElement.addEventListener('pointerdown', onPointer);

  function onResize() {
    const w2 = container.clientWidth || 800;
    const h2 = Math.max(300, container.clientHeight || 320);
    const aspect2 = w2 / h2;
    const md = Math.min(w2, h2);
    let baseSpacing2 = Math.max(0.6, Math.min((md / 360) * 1.2, 3.6));
    if (isTouch && md < 1100) baseSpacing2 = Math.min(baseSpacing2 * 1.5, 5.0);
    const spacingX2 = baseSpacing2;
    const plateRadius2 = baseSpacing2 * plateRadiusRatio;
    const contentWidth2 = 3 * spacingX2 + 2 * plateRadius2;
    const topHeight = plateTop + diskThickness / 2 + (MAX_PER_PEG - 1) * stackSpacing;
    const bottomHeight = plateY - plateHeight / 2;
    const contentHeightWorld = topHeight - bottomHeight;
    const halfW_horiz = (contentWidth2 / 2) * paddingFactor;
    const halfW_vert = (contentHeightWorld / 2) * aspect2 * paddingFactor;
    const visualZoom = Math.max(1.0, isTouch ? (md < 420 ? 1.0 : md < 720 ? 1.0 : 1.0) : md < 900 ? 1.0 : 1.0);
    lastVisualZoom = visualZoom;

    const xs = pegPositions.map((p) => p.x);
    const zs = pegPositions.map((p) => p.z);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const centerY = bottomHeight + contentHeightWorld * 0.44;
    const contentRadius = Math.max(maxX - minX, maxZ - minZ, contentHeightWorld, 1.0);
    const CAM_Y = isTouch ? 1.2 : 1.7;
    const CAM_Z = isTouch ? 2.9 : 4.0;
    camera.position.set(centerX, centerY + contentRadius * CAM_Y, centerZ + contentRadius * CAM_Z);
    camera.lookAt(centerX, centerY, centerZ);
    computeAndApplyOrtho(camera, { minX, maxX, minZ, maxZ, minY: bottomHeight, maxY: topHeight }, paddingFactor, visualZoom, TOP_CROP_DEFAULT);
    renderer.setSize(w2, h2);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  window.addEventListener('resize', onResize);
  try { onResize(); } catch {}
  requestAnimationFrame(() => { try { fitContainerToViewport(); onResize(); } catch {} });
  [80, 300, 900].forEach((ms) => window.setTimeout(() => { try { fitContainerToViewport(); onResize(); } catch {} }, ms));

  function handleOrientation() {
    try { fitContainerToViewport(); onResize(); } catch {}
    window.setTimeout(() => { try { fitContainerToViewport(); onResize(); } catch {} }, 260);
  }
  window.addEventListener('orientationchange', handleOrientation);
  window.addEventListener('pageshow', handleOrientation);
  (window as any).visualViewport?.addEventListener?.('resize', fitContainerToViewport);
}
