import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ZetlaPage.css';

gsap.registerPlugin(ScrollTrigger);

const V = `?t=${Date.now()}`;

const THEMES = [
  { name: 'Default',     accent: '#6C63FF', bg: '#eaeef5', image: `/zetla/theme-default.png${V}` },
  { name: 'Gruvbox',     accent: '#D79921', bg: '#f5f0e6', image: `/zetla/theme-gruvbox.png${V}` },
  { name: 'Solarized',   accent: '#268BD2', bg: '#e8f5ee', image: `/zetla/theme-solarized.png${V}` },
  { name: 'Nord',        accent: '#88C0D0', bg: '#eaf5f5', image: `/zetla/theme-nord.png${V}` },
  { name: 'Catppuccin',  accent: '#CBA6F7', bg: '#f5eef5', image: `/zetla/theme-catppuccin.png${V}` },
];

const FEATURES = [
  {
    title: 'Any model. Your keys.',
    desc: 'Connect to OpenCode Zen, DeepSeek, or NVIDIA NIM. Pick your model, send your prompt, and you are off.',
    detail: 'OpenAI API Support · Token Limiting Support · System Prompt Support',
    image: `/zetla/feature-chat.png${V}`,
    bg: '#f0eef8',
  },
  {
    title: 'Talk to it. It talks back.',
    desc: 'Offline voice recognition powered by Vosk. Chat hands-free while cooking, driving, or walking the dog.',
    detail: 'Bundled Model · Multiple TTS Voices · Configurable Speed',
    image: `/zetla/feature-voice.gif${V}`,
    bg: '#f5f0e6',
  },
  {
    title: 'Grounded in reality.',
    desc: 'The LLM searches the web and reads full pages; great for planning trips, comparing products, or fact-checking on the fly.',
    detail: 'Exa AI MCP · Search + URL Fetch · web_search Tool',
    image: `/zetla/feature-search.png${V}`,
    bg: '#e8f5ee',
  },
  {
    title: 'Feed it anything.',
    desc: 'Upload PDFs, Images, Word Docs, Excel Sheets, Presentations, or Text Files. Zetla reads them all - class notes, instruction PDFs, you name it.',
    detail: 'PDF · DOCX · XLSX · PPTX · CSV · Images · Limit: 10 MB',
    image: `/zetla/feature-files.png${V}`,
    bg: '#f5eaea',
  },
  {
    title: 'Pick your palette.',
    desc: 'Five handcrafted color schemes: Default, Gruvbox, Solarized, Nord and Catppuccin. Make the app feel like yours.',
    detail: '5 themes · Dark & Light Modes · Match Your Vibe',
    image: THEMES[0].image,
    bg: THEMES[0].bg,
    carousel: true,
  },
  {
    title: 'Hear it your way.',
    desc: 'Multiple English voices from your device\'s TTS engine, with playback speed from slow to fast.',
    detail: 'Android TTS · Voice Picker · 0.25x-2.0x Speed',
    image: `/zetla/feature-tts.png${V}`,
    bg: '#f5eaee',
  },
  {
    title: 'Code runs here.',
    desc: 'A standalone Python 3.14 built with all stdlib modules. No cloud sandbox needed. Ask the LLM to run math, simulations, or data analysis right on your phone.',
    detail: 'Sandboxed · Standalone · run_code Tool',
    image: `/zetla/feature-python.png${V}`,
    bg: '#faf0e6',
  },
];

const ALL_FEATURES = [
  { name: 'LLM Chat', detail: 'Multi-provider SSE streaming' },
  { name: 'Voice Chat', detail: 'Vosk offline + Android TTS' },
  { name: 'Web Search', detail: 'Exa AI MCP integration' },
  { name: 'On-device Python', detail: 'CPython with standard library modules' },
  { name: 'Tool Calling', detail: 'Agent loop, up to 10 iterations' },
  { name: 'File Upload', detail: 'PDF, DOCX, XLSX, PPTX, CSV, images, text files' },
  { name: 'Color Themes', detail: '5 schemes · dark & light' },
  { name: 'TTS Voices', detail: 'Multi-voice · 0.25x-2.0x speed' }
];

const FAQS = [
  {
    q: 'What API keys does Zetla need?',
    a: 'Zetla was built with BYOK (Bring Your Own Key) in mind. It currently supports OpenCode Zen, DeepSeek, or NVIDIA NIM. You as a user have to create your account with the respective providers and provide the key to use this application. No vendor lock-in. Your keys stay on your device.',
  },
  {
    q: 'Can I save my conversations?',
    a: 'Yes. Sessions save automatically on your device. Rename, star, or delete them anytime. Come back later and pick up exactly where you left off.',
  },
  {
    q: 'Does the Python runtime work offline?',
    a: 'Yes. CPython 3.14.6 is bundled as a static binary with 93 stdlib modules. Code execution is sandboxed by Android itself.',
  },
  {
    q: 'How does voice chat work?',
    a: 'Speech recognition uses Vosk, an offline engine bundled in the app. Text-to-speech uses Android native TTS with selectable voices and adjustable speed.',
  },
  {
    q: 'Is my data private?',
    a: 'Session storage, file processing, and code execution all happen on your device. Chat queries go only to the LLM provider you choose with your own API key. Zetla itself never phones home.',
  },
  {
    q: 'What can I use Zetla for?',
    a: 'Plan trips with researched web results, brainstorm projects, understand long PDFs or lecture notes in seconds, run live calculations with Python, or just chat. The agentic loop combines web search and code execution for complex tasks.',
  },
  {
    q: 'What files can I upload?',
    a: 'Images, PDFs, Word docs, Excel sheets, PowerPoints, CSVs, and code files (max 10 MB). Processing is on-device - PDFBox for PDFs, built-in parsers for Office documents.',
  },
  {
    q: 'Which Android versions are supported?',
    a: 'Android 8.0 (API 26) and above. Both arm64-v8a and armeabi-v7a APKs are provided.',
  },
  {
    q: 'Can it generate images or handle multimodal output?',
    a: 'Zetla supports multimodal input as of today, to upload images and ask questions about them. Output-side multimodality is not yet supported but planned for the future.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`zetla-faq-item ${open ? 'is-open' : ''}`}>
      <button className="zetla-faq-q" onClick={() => setOpen((v) => !v)}>
        <span>{q}</span>
        <span className={`zetla-faq-chevron ${open ? 'is-open' : ''}`}>&rsaquo;</span>
      </button>
      <div className="zetla-faq-a-wrap">
        <div className="zetla-faq-a">{a}</div>
      </div>
    </div>
  );
}

export default function ZetlaPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const heroPhoneRef = useRef<HTMLDivElement>(null);

  const featureRefs = useRef<(HTMLElement | null)[]>([]);

  const tableRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  const [themeIndex, setThemeIndex] = useState(0);
  const themeIndexRef = useRef(0);
  const carouselAreaRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const frontImgRef = useRef<HTMLImageElement>(null);
  const backImgRef = useRef<HTMLImageElement>(null);
  const showFrontRef = useRef(true);
  let wheelAccum = 0;

  // Scroll through themes
  useEffect(() => {
    const el = carouselAreaRef.current;
    if (!el) return;

    // Reset any lingering stack translation on mount
    gsap.set(stackRef.current, { x: 0 });

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelAccum += Math.abs(e.deltaX || e.deltaY);
      if (wheelAccum < 400) return;
      wheelAccum = 0;
      navigateTheme((e.deltaX || e.deltaY) > 0 ? 1 : -1);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  //  Carousel init 
  useEffect(() => {
    const front = frontImgRef.current;
    const back = backImgRef.current;
    if (!front || !back) return;
    gsap.set(front, { opacity: 1 });
    gsap.set(back, { opacity: 0 });
    showFrontRef.current = true;
  }, []);

  const goToTheme = (next: number) => {
    if (next === themeIndexRef.current) return;
    const front = frontImgRef.current;
    const back = backImgRef.current;
    if (!front || !back) return;
    const showing = showFrontRef.current ? front : back;
    const hidden = showFrontRef.current ? back : front;
    hidden.src = THEMES[next].image;
    gsap.set(showing, { opacity: 0 });
    gsap.set(hidden, { opacity: 1 });
    showFrontRef.current = !showFrontRef.current;
    themeIndexRef.current = next;
    setThemeIndex(next);
  };

  const navigateTheme = (dir: 1 | -1) => {
    goToTheme((themeIndexRef.current + dir + THEMES.length) % THEMES.length);
  };

  //  Dynamic title + favicon 
  useEffect(() => {
    const prevTitle = document.title;
    const prevFavicon = (document.querySelector('link[rel="icon"]') as HTMLLinkElement)?.href;
    document.title = 'Zetla';
    const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (link) link.href = `/zetla/zetla-icon.svg${V}`;
    return () => {
      document.title = prevTitle;
      if (link && prevFavicon) link.href = prevFavicon;
    };
  }, []);

  //  Hero entrance 
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from(heroTitleRef.current, { y: 30, opacity: 0, duration: 0.9 })
      .from(heroSubtitleRef.current, { y: 20, opacity: 0, duration: 0.8 }, '-=0.5')
      .from(heroPhoneRef.current, { y: 50, opacity: 0, scale: 0.96, duration: 1 }, '-=0.6');

    // Tag pins: pop in then gentle float
    const pins = pageRef.current!.querySelectorAll('[data-pin]');
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
  }, { scope: pageRef });

  //  Feature scroll sections 
  useGSAP(() => {
    featureRefs.current.forEach((section) => {
      if (!section) return;
      const text = section.querySelector('.zetla-feature-text');
      const img = section.querySelector('.zetla-feature-img');

      gsap.from(text, {
        x: -50,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 78%',
          toggleActions: 'play none none reverse',
        },
      });

      gsap.from(img, {
        x: 50,
        opacity: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 78%',
          toggleActions: 'play none none reverse',
        },
      });
    });
  }, { scope: pageRef });

  //  Features table stagger 
  useGSAP(() => {
    if (!tableRef.current) return;
    const rows = tableRef.current.querySelectorAll('.zetla-table-row');
    gsap.from(rows, {
      y: 20,
      opacity: 0,
      stagger: 0.05,
      duration: 0.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: tableRef.current,
        start: 'top 88%',
        toggleActions: 'play none none reverse',
      },
    });
  }, { scope: pageRef });

  //  CTA 
  useGSAP(() => {
    if (!ctaRef.current) return;
    gsap.from(ctaRef.current.querySelectorAll('.zetla-cta-el'), {
      y: 30,
      opacity: 0,
      stagger: 0.12,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: ctaRef.current,
        start: 'top 88%',
        toggleActions: 'play none none reverse',
      },
    });
  }, { scope: pageRef });

  const githubBase = 'https://github.com/aradhya-chakrabarti/zetla';

  return (
    <div ref={pageRef} className="zetla-page">
      {/*  Nav  */}
      <nav className="zetla-nav">
        <span className="zetla-nav-brand">Zetla</span>
        <div className="zetla-nav-links">
          <a href={`${githubBase}`} target="_blank" rel="noopener noreferrer">
            Source
          </a>
          <a href="#zetla-download">Download</a>
          <a
            href={`${githubBase}/blob/main/LICENSE`}
            target="_blank"
            rel="noopener noreferrer"
          >
            License
          </a>
          <a href="https://aradhyac.com" target="_blank" rel="noopener noreferrer">
            Blog
          </a>
        </div>
      </nav>

      {/*  Hero  */}
      <section ref={heroRef} className="zetla-hero">
        <div className="zetla-hero-inner">
          <div className="zetla-hero-text">
            <h1 ref={heroTitleRef} className="zetla-hero-title">
              Zetla knows what<br />actually matters.
            </h1>
            <p ref={heroSubtitleRef} className="zetla-hero-subtitle">
              AI-powered Android app with text and voice chat,
              web search and code execution tool calling. Your keys, your data.
            </p>
          </div>
          <div ref={heroPhoneRef} className="zetla-hero-visual">
            <div className="zetla-phone-card">
              <img
                className="zetla-hero-video"
                src={`/zetla/hero-clip.gif${V}`}
                alt="Zetla demo"
              />
              {/* Tags pinned onto the phone card */}
              <div className="zetla-pin zetla-pin-ribbon" data-pin>
                <svg viewBox="0 0 130 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4h114l-16 20L118 44H4L20 24 4 4z" fill="#6C63FF"/>
                  <text x="61" y="28" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" fontFamily="Georgia,serif" letterSpacing="0.5">LLM Chat</text>
                </svg>
              </div>

              <div className="zetla-pin zetla-pin-newspaper" data-pin>
                <svg viewBox="0 0 180 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="178" height="70" rx="2" fill="#f5f0e8" stroke="#222" strokeWidth="1.5"/>
                  <rect x="10" y="14" width="160" height="6" fill="#222"/>
                  <rect x="10" y="26" width="70" height="3" rx="1" fill="#999"/>
                  <rect x="10" y="33" width="160" height="2" rx="1" fill="#ccc"/>
                  <rect x="10" y="39" width="160" height="2" rx="1" fill="#ccc"/>
                  <rect x="10" y="45" width="120" height="2" rx="1" fill="#ccc"/>
                  <rect x="130" y="26" width="40" height="30" rx="2" fill="#e0d8c8"/>
                  <text x="90" y="11" textAnchor="middle" fill="#222" fontSize="6" fontWeight="700" fontFamily="Georgia,serif" letterSpacing="1.5">THE DAILY ZETLA</text>
                  <text x="45" y="30" textAnchor="middle" fill="#222" fontSize="7" fontWeight="700" fontFamily="Georgia,serif">WEB</text>
                  <text x="150" y="30" textAnchor="middle" fill="#222" fontSize="7" fontWeight="700" fontFamily="Georgia,serif">SEARCH</text>
                </svg>
                <div className="zetla-tack">
                  <div className="zetla-tack-head"/>
                  <div className="zetla-tack-shadow"/>
                </div>
              </div>

              <div className="zetla-pin zetla-pin-sticker" data-pin>
                <svg viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="55" cy="55" r="52" fill="#FFD600" stroke="#222" strokeWidth="2.5"/>
                  <circle cx="55" cy="55" r="44" fill="none" stroke="#222" strokeWidth="1" strokeDasharray="4 3"/>
                  <text x="55" y="50" textAnchor="middle" fill="#222" fontSize="10" fontWeight="900" fontFamily="Impact,sans-serif" letterSpacing="1">OPEN</text>
                  <text x="55" y="66" textAnchor="middle" fill="#222" fontSize="10" fontWeight="900" fontFamily="Impact,sans-serif" letterSpacing="1">SOURCE</text>
                </svg>
              </div>

              <div className="zetla-pin zetla-pin-ticket" data-pin>
                <svg viewBox="0 0 150 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="148" height="54" rx="6" fill="#7c3aed"/>
                  <circle cx="12" cy="28" r="6" fill="#fafaf7"/>
                  <circle cx="138" cy="28" r="6" fill="#fafaf7"/>
                  <line x1="24" y1="1" x2="24" y2="55" stroke="#fafaf7" strokeWidth="1" strokeDasharray="3 3" opacity="0.4"/>
                  <text x="86" y="22" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700" fontFamily="-apple-system,sans-serif" letterSpacing="2">Bring Your</text>
                  <text x="86" y="40" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="16" fontWeight="300" fontFamily="Georgia,serif" letterSpacing="1">Own Key</text>
                </svg>
              </div>

              <div className="zetla-pin zetla-pin-badge" data-pin>
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="50,2 61,36 98,36 68,58 79,92 50,72 21,92 32,58 2,36 39,36" fill="#ff4d6a"/>
                  <polygon points="50,14 58,36 82,36 63,50 70,74 50,60 30,74 37,50 18,36 42,36" fill="#ff6b82"/>
                  <text x="50" y="48" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="800" fontFamily="Georgia,serif" letterSpacing="0.5">VOICE</text>
                  <text x="50" y="60" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="800" fontFamily="Georgia,serif">CHAT</text>
                </svg>
                <div className="zetla-tack">
                  <div className="zetla-tack-head"/>
                  <div className="zetla-tack-shadow"/>
                </div>
              </div>

              <div className="zetla-pin zetla-pin-handwritten" data-pin>
                <svg viewBox="0 0 130 46" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="126" height="42" rx="6" fill="#fff" stroke="#222" strokeWidth="1.5"/>
                  <line x1="2" y1="24" x2="128" y2="24" stroke="#e44" strokeWidth="1" strokeDasharray="0"/>
                  <text x="65" y="21" textAnchor="middle" fill="#222" fontSize="14" fontFamily="Georgia,serif" fontStyle="italic">your phone,</text>
                  <text x="65" y="37" textAnchor="middle" fill="#222" fontSize="14" fontFamily="Georgia,serif" fontStyle="italic">your data.</text>
                </svg>
                <div className="zetla-tack">
                  <div className="zetla-tack-head"/>
                  <div className="zetla-tack-shadow"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*  Feature sections  */}
      {FEATURES.map((feat, i) => {
        const isCarousel = 'carousel' in feat;
        const currentTheme = isCarousel ? THEMES[themeIndex] : null;
        return (
          <section
            key={feat.title}
            ref={(el) => { featureRefs.current[i] = el; }}
            className={`zetla-feature-bg ${i % 2 === 1 ? 'is-flipped' : ''}`}
            style={{ background: currentTheme ? currentTheme.bg : feat.bg }}
          >
            <div className={`zetla-feature-section ${i % 2 === 1 ? 'is-flipped' : ''}`}>
              <div className="zetla-feature-text">
                <span className="zetla-feature-eyebrow">{`0${i + 1}`}</span>
                <h2 className="zetla-feature-title">{feat.title}</h2>
                <p className="zetla-feat-desc">{feat.desc}</p>
                <p className="zetla-feat-detail">{feat.detail}</p>
              </div>
              <div className={`zetla-feature-img${isCarousel ? ' zetla-feature-img-carousel' : ''}`}>
                <div
                  ref={isCarousel ? carouselAreaRef : undefined}
                  className="zetla-feature-img-inner"
                >
                  {isCarousel ? (
                    <div ref={stackRef} className="zetla-carousel-stack">
                      <img
                        ref={frontImgRef}
                        src={THEMES[0].image}
                        alt=""
                        draggable={false}
                        className="zetla-carousel-stack-img"
                      />
                      <img
                        ref={backImgRef}
                        src={THEMES[0].image}
                        alt=""
                        draggable={false}
                        className="zetla-carousel-stack-img"
                      />
                    </div>
                  ) : (
                    <img
                      src={feat.image}
                      alt={feat.title}
                      draggable={false}
                      className=""
                    />
                  )}
                </div>
                {isCarousel && (
                  <div className="zetla-carousel-controls">
                    <button
                      type="button"
                      className="zetla-carousel-btn"
                      onClick={() => navigateTheme(-1)}
                      aria-label="Previous theme"
                    >
                      &#9664;
                    </button>
                    <div className="zetla-carousel-dots">
                      {THEMES.map((_, j) => (
                        <span
                          key={j}
                          className={`zetla-carousel-dot ${j === themeIndex ? 'is-active' : ''}`}
                          onClick={() => goToTheme(j)}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      className="zetla-carousel-btn"
                      onClick={() => navigateTheme(1)}
                      aria-label="Next theme"
                    >
                      &#9654;
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}

      {/*  Features table  */}
      <section className="zetla-table-bg">
        <div className="zetla-table-section">
          <h2 className="zetla-section-title">Everything you need.</h2>
          <p className="zetla-section-subtitle">
            A complete AI toolkit that fits in your pocket.
          </p>
          <div ref={tableRef} className="zetla-table">
            {ALL_FEATURES.map((f) => (
              <div key={f.name} className="zetla-table-row">
                <span className="zetla-table-name">{f.name}</span>
                <span className="zetla-table-detail">{f.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  Download CTA  */}
      <section ref={ctaRef} id="zetla-download" className="zetla-cta">
        <div className="zetla-cta-logo zetla-cta-el">
          <img src={`/zetla/zetla-icon.svg${V}`} alt="Zetla" />
        </div>
        <h2 className="zetla-cta-title zetla-cta-el">Get Zetla now.</h2>
        <p className="zetla-cta-subtitle zetla-cta-el">
          Open source. Free. Download the APK that fits your device.
        </p>
        <div className="zetla-cta-buttons zetla-cta-el">
          <a
            href={`${githubBase}/releases/latest/download/app-release-arm64.apk`}
            target="_blank"
            rel="noopener noreferrer"
            className="zetla-btn zetla-btn-primary"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M8 .198a8 8 0 00-2.53 15.59c.4.074.546-.174.546-.388 0-.192-.007-.70-.01-1.37-2.22.484-2.69-1.07-2.69-1.07-.363-.923-.887-1.17-.887-1.17-.726-.497.055-.487.055-.487.803.056 1.225.825 1.225.825.714 1.223 1.872.87 2.33.666.072-.517.28-.87.51-1.07-1.77-.2-3.63-.885-3.63-3.943 0-.872.312-1.586.824-2.146-.083-.202-.357-1.015.078-2.116 0 0 .672-.215 2.2.82a7.6 7.6 0 012.004-.27c.68.003 1.366.092 2.004.27 1.527-1.035 2.198-.82 2.198-.82.437 1.101.163 1.914.08 2.116.513.56.823 1.274.823 2.146 0 3.07-1.864 3.74-3.64 3.936.288.248.543.736.543 1.484 0 1.072-.01 1.936-.01 2.2 0 .216.144.466.55.387A8.001 8.001 0 008 .198z" />
            </svg>
            arm64-v8a
          </a>
          <a
            href={`${githubBase}/releases/latest/download/app-release-armv7.apk`}
            target="_blank"
            rel="noopener noreferrer"
            className="zetla-btn zetla-btn-secondary"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M8 .198a8 8 0 00-2.53 15.59c.4.074.546-.174.546-.388 0-.192-.007-.70-.01-1.37-2.22.484-2.69-1.07-2.69-1.07-.363-.923-.887-1.17-.887-1.17-.726-.497.055-.487.055-.487.803.056 1.225.825 1.225.825.714 1.223 1.872.87 2.33.666.072-.517.28-.87.51-1.07-1.77-.2-3.63-.885-3.63-3.943 0-.872.312-1.586.824-2.146-.083-.202-.357-1.015.078-2.116 0 0 .672-.215 2.2.82a7.6 7.6 0 012.004-.27c.68.003 1.366.092 2.004.27 1.527-1.035 2.198-.82 2.198-.82.437 1.101.163 1.914.08 2.116.513.56.823 1.274.823 2.146 0 3.07-1.864 3.74-3.64 3.936.288.248.543.736.543 1.484 0 1.072-.01 1.936-.01 2.2 0 .216.144.466.55.387A8.001 8.001 0 008 .198z" />
            </svg>
            armeabi-v7a
          </a>
        </div>
      </section>

      {/*  FAQ  */}
      <section className="zetla-faq-bg">
        <div className="zetla-faq-section">
          <h2 className="zetla-section-title">Frequently asked questions.</h2>
          <div className="zetla-faq-list">
            {FAQS.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/*  Footer  */}
      <footer className="zetla-footer">
        <span>&copy; 2026 Aradhya Chakrabarti</span>
        <span className="zetla-footer-sep">&middot;</span>
        <span>MIT License</span>
        <span className="zetla-footer-sep">&middot;</span>
        <a href="https://aradhyac.com" target="_blank" rel="noopener noreferrer">aradhyac.com</a>
      </footer>
    </div>
  );
}
