// oneko.ts - adapted from oneko.js by adryd325
// Exports startOneko(container, options) -> stop()

export function startOneko(container: HTMLElement, options?: { catUrl?: string; size?: number }) {
  const catUrl = options?.catUrl ?? '/oneko.gif';
  const size = options?.size ?? 32;

  // element
  const nekoEl = document.createElement('div');
  nekoEl.setAttribute('aria-hidden', 'true');
  nekoEl.style.width = `${size}px`;
  nekoEl.style.height = `${size}px`;
  nekoEl.style.position = 'absolute';
  nekoEl.style.pointerEvents = 'none';
  nekoEl.style.imageRendering = 'pixelated';
  nekoEl.style.zIndex = '2147483647';
  nekoEl.style.backgroundImage = `url(${catUrl})`;
  nekoEl.style.backgroundRepeat = 'no-repeat';
  nekoEl.style.transform = 'translate(-50%, -50%)';
  nekoEl.style.willChange = 'transform, left, top';

  // append to container
  // ensure container is positioned so absolute works
  const prevPosition = container.style.position;
  if (!prevPosition || prevPosition === '') container.style.position = 'relative';
  container.appendChild(nekoEl);

  // state
  let nekoPosX = size * 1.5; // start near top-left
  let nekoPosY = size * 1.5;
  // track raw client coordinates and compute container-relative target on each frame
  let mouseClientX = 0;
  let mouseClientY = 0;
  let mousePosX = 0;
  let mousePosY = 0;
  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation: string | null = null;
  let idleAnimationFrame = 0;
  const nekoSpeed = 10;

  const spriteSets: Record<string, number[][]> = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [[-5, 0], [-6, 0], [-7, 0]],
    scratchWallN: [[0, 0], [0, -1]],
    scratchWallS: [[-7, -1], [-6, -2]],
    scratchWallE: [[-2, -2], [-2, -3]],
    scratchWallW: [[-4, 0], [-4, -1]],
    tired: [[-3, -2]],
    sleeping: [[-2, 0], [-2, -1]],
    N: [[-1, -2], [-1, -3]],
    NE: [[0, -2], [0, -3]],
    E: [[-3, 0], [-3, -1]],
    SE: [[-5, -1], [-5, -2]],
    S: [[-6, -3], [-7, -2]],
    SW: [[-5, -3], [-6, -1]],
    W: [[-4, -2], [-4, -3]],
    NW: [[-1, 0], [-1, -1]],
  };

  function setSprite(name: string, frame: number) {
    const set = spriteSets[name];
    if (!set) return;
    const sprite = set[frame % set.length];
    nekoEl.style.backgroundPosition = `${sprite[0] * size}px ${sprite[1] * size}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;
    if (
      idleTime > 10 &&
      Math.floor(Math.random() * 200) === 0 &&
      idleAnimation == null
    ) {
      const available = ['sleeping', 'scratchSelf'];
      const rect = container.getBoundingClientRect();
      if (nekoPosX < size * 2) available.push('scratchWallW');
      if (nekoPosY < size * 2) available.push('scratchWallN');
      if (nekoPosX > rect.width - size * 2) available.push('scratchWallE');
      if (nekoPosY > rect.height - size * 2) available.push('scratchWallS');
      idleAnimation = available[Math.floor(Math.random() * available.length)];
    }

    switch (idleAnimation) {
      case 'sleeping':
        if (idleAnimationFrame < 8) {
          setSprite('tired', 0);
          break;
        }
        setSprite('sleeping', Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192) resetIdleAnimation();
        break;
      case 'scratchWallN':
      case 'scratchWallS':
      case 'scratchWallE':
      case 'scratchWallW':
      case 'scratchSelf':
        setSprite(idleAnimation as string, idleAnimationFrame);
        if (idleAnimationFrame > 9) resetIdleAnimation();
        break;
      default:
        setSprite('idle', 0);
        return;
    }
    idleAnimationFrame += 1;
  }

  function frame() {
    frameCount += 1;
    const rect = container.getBoundingClientRect();
    // compute fresh container-relative mouse position each frame so scrolling/resize
    // between the last mouse event and now doesn't break the mapping
    mousePosX = mouseClientX - rect.left;
    mousePosY = mouseClientY - rect.top;
    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);

    if (distance < nekoSpeed || distance < size * 1.5) {
      idle();
      return;
    }

    idleAnimation = null;
    idleAnimationFrame = 0;

    if (idleTime > 1) {
      setSprite('alert', 0);
      idleTime = Math.min(idleTime, 7);
      idleTime -= 1;
      return;
    }

    let direction = '';
    direction = diffY / distance > 0.5 ? 'N' : direction;
    direction = diffY / distance < -0.5 ? direction + 'S' : direction;
    direction = diffX / distance > 0.5 ? direction + 'W' : direction;
    direction = diffX / distance < -0.5 ? direction + 'E' : direction;
    setSprite(direction || 'idle', frameCount);

    nekoPosX -= (diffX / distance) * nekoSpeed;
    nekoPosY -= (diffY / distance) * nekoSpeed;

    // clamp inside container
    const rectW = rect.width;
    const rectH = rect.height;
    nekoPosX = Math.min(Math.max(size, nekoPosX), rectW - size);
    nekoPosY = Math.min(Math.max(size, nekoPosY), rectH - size);

    nekoEl.style.left = `${nekoPosX}px`;
    nekoEl.style.top = `${nekoPosY}px`;
  }

  // mouse handling (use window so movement is tracked even when cursor leaves the container's visible area)
  function onWindowMove(e: MouseEvent) {
    // store client coordinates; actual container-relative conversion is done in frame()
    mouseClientX = e.clientX;
    mouseClientY = e.clientY;
    idleTime = 0;
  }

  // requestAnimationFrame loop state
  let rafId: number | null = null;
  let lastFrameTimestamp = 0;

  function loop(timestamp: number) {
    if (!lastFrameTimestamp) lastFrameTimestamp = timestamp;
    if (timestamp - lastFrameTimestamp > 100) {
      lastFrameTimestamp = timestamp;
      frame();
    }
    rafId = window.requestAnimationFrame(loop);
  }

  // replace container listener with window-level listener so Oneko still follows cursor
  // even if the container is scrolled out of view or the neko element itself is offscreen.
  // wire up
  window.addEventListener('mousemove', onWindowMove);
  rafId = window.requestAnimationFrame(loop);

  function stop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    window.removeEventListener('mousemove', onWindowMove);
    if (nekoEl && nekoEl.parentElement) nekoEl.parentElement.removeChild(nekoEl);
    // restore position style
    if (!prevPosition || prevPosition === '') container.style.position = prevPosition;
  }

  return stop;
}
