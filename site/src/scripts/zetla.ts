import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { THEMES } from '../data/zetla';

gsap.registerPlugin(ScrollTrigger);

const page = document.querySelector('.zetla-page') as HTMLElement;

// hero entrance
const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
tl.from('.zetla-hero-title', { y: 30, opacity: 0, duration: 0.9 })
  .from('.zetla-hero-subtitle', { y: 20, opacity: 0, duration: 0.8 }, '-=0.5')
  .from('.zetla-hero-visual', { y: 50, opacity: 0, scale: 0.96, duration: 1 }, '-=0.6');

// pinned tags: pop in then float
const pins = page.querySelectorAll('[data-pin]');
pins.forEach((pin, i) => {
  gsap.from(pin, {
    scale: 0,
    opacity: 0,
    rotation: gsap.utils.random(-20, 20),
    duration: 0.55,
    delay: 0.8 + i * 0.13,
    ease: 'back.out(2.2)',
  });
  gsap.to(pin, {
    y: `+=${gsap.utils.random(4, 10)}`,
    rotation: `+=${gsap.utils.random(-2, 2)}`,
    duration: gsap.utils.random(2.2, 3.5),
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
    delay: 1.2 + i * 0.2,
  });
});

// feature sections
page.querySelectorAll('.zetla-feature-bg').forEach((section) => {
  const text = section.querySelector('.zetla-feature-text');
  const img = section.querySelector('.zetla-feature-img');
  const opts = {
    start: 'top 78%',
    toggleActions: 'play none none reverse',
  };
  if (text) gsap.from(text, { x: -50, opacity: 0, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: section, ...opts } });
  if (img) gsap.from(img, { x: 50, opacity: 0, duration: 0.9, ease: 'power2.out', scrollTrigger: { trigger: section, ...opts } });
});

// features table stagger
const table = document.querySelector('.zetla-table');
if (table) {
  gsap.from(table.querySelectorAll('.zetla-table-row'), {
    y: 20,
    opacity: 0,
    stagger: 0.05,
    duration: 0.5,
    ease: 'power2.out',
    scrollTrigger: { trigger: table, start: 'top 88%', toggleActions: 'play none none reverse' },
  });
}

// CTA
const cta = document.querySelector('.zetla-cta');
if (cta) {
  gsap.from(cta.querySelectorAll('.zetla-cta-el'), {
    y: 30,
    opacity: 0,
    stagger: 0.12,
    duration: 0.6,
    ease: 'power2.out',
    scrollTrigger: { trigger: cta, start: 'top 88%', toggleActions: 'play none none reverse' },
  });
}

// theme carousel
const front = document.getElementById('zetla-carousel-front') as HTMLImageElement;
const back = document.getElementById('zetla-carousel-back') as HTMLImageElement;
const carouselArea = document.querySelector('.zetla-carousel-stack') as HTMLElement;
const carouselSection = document.querySelector('.zetla-carousel-section') as HTMLElement;
const dots = Array.from(document.querySelectorAll('.zetla-carousel-dot')) as HTMLElement[];
let themeIndex = 0;
let showFront = true;
let wheelAccum = 0;

gsap.set(front, { opacity: 1 });
gsap.set(back, { opacity: 0 });

function goToTheme(next: number) {
  if (next === themeIndex) return;
  const showing = showFront ? front : back;
  const hidden = showFront ? back : front;
  hidden.src = THEMES[next].image;
  gsap.set(showing, { opacity: 0 });
  gsap.set(hidden, { opacity: 1 });
  showFront = !showFront;
  themeIndex = next;
  dots.forEach((d, i) => d.classList.toggle('is-active', i === next));
  if (carouselSection) carouselSection.style.background = THEMES[next].bg;
}

const navigateTheme = (dir: number) =>
  goToTheme((themeIndex + dir + THEMES.length) % THEMES.length);

carouselArea.addEventListener('wheel', (e) => {
  e.preventDefault();
  wheelAccum += Math.abs(e.deltaX || e.deltaY);
  if (wheelAccum < 400) return;
  wheelAccum = 0;
  navigateTheme((e.deltaX || e.deltaY) > 0 ? 1 : -1);
}, { passive: false });

document.getElementById('zetla-carousel-prev')?.addEventListener('click', () => navigateTheme(-1));
document.getElementById('zetla-carousel-next')?.addEventListener('click', () => navigateTheme(1));
dots.forEach((d, i) => d.addEventListener('click', () => goToTheme(i)));

// FAQ accordion (delegated)
document.querySelector('.zetla-faq-list')?.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('.zetla-faq-q');
  if (!btn) return;
  btn.parentElement?.classList.toggle('is-open');
});
