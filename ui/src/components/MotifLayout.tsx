// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import { Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchBlogs, clearBlogSearch } from '../store/actions/blogActions';
import SOCIAL_LINKS from '../pages/constants/socialLinks';

// --- THEMES ---
const lightTheme = {
  bg: '#d0cfc8',            // window backgrounds (updated per user)
  bgPattern: 'repeating-conic-gradient(#d0cfc8 0% 25%, #cfcbb6 0% 50%) 50% / 2px 2px',
  text: '#222222',
  titleBarBg: '#5A6A92', // active window title bar
  titleBarText: '#FFFFFF',
  borderLight: '#E0E0E0', // 3D highlight
  borderDark: '#404040', // 3D shadow
  borderDarker: '#000000',
  cardBg: '#9a9a9a',      // darker card/footer background
  footerBg: '#6f6f6f',    // darker footer background
  desktopBg: '#506070',
  toolbarBg: '#a0c5c3',
  inputBg: '#e6e6e2',     // more grey, less beige
  inputBgFocus: '#d6d6d2',
  imageFilter: 'none',
  inputPlaceholder: 'rgba(0,0,0,0.45)',
  subcardBg: '#efefef',
  paperBg: '#f7f7f7',
  placeholderBg: 'linear-gradient(135deg,#e8eef6,#cfe0f8)',
  placeholderText: '#20456b'
};

const darkTheme = {
  bg: '#4A4A4A',
  bgPattern: 'repeating-conic-gradient(#4A4A4A 0% 25%, #404040 0% 50%) 50% / 2px 2px',
  text: '#E0E0E0',
  titleBarBg: '#5A6A92',
  titleBarText: '#E0E0E0',
  borderLight: '#6A6A6A',
  borderDark: '#1A1A1A',
  borderDarker: '#000000',
  cardBg: '#5a5a5a',
  footerBg: '#363636',
  desktopBg: '#506070',
  toolbarBg: '#3f6b6a',
  inputBg: '#3e3e3e',
  inputBgFocus: '#2f2f2f',
  imageFilter: 'brightness(0.6)',
  inputPlaceholder: 'rgba(255,255,255,0.45)',
  subcardBg: '#333333',
  paperBg: '#2f2f2f',
  placeholderBg: 'linear-gradient(135deg,#2b2b2b,#3a3a3a)',
  placeholderText: '#e6e6e6'
};

const GlobalStyle = createGlobalStyle`
  :root {
    --motif-bg: ${(p: any) => p.theme.bg};
    --motif-text: ${(p: any) => p.theme.text};
    --motif-titlebar-bg: ${(p: any) => p.theme.titleBarBg};
    --motif-titlebar-text: ${(p: any) => p.theme.titleBarText};
    --motif-border-light: ${(p: any) => p.theme.borderLight};
    --motif-border-dark: ${(p: any) => p.theme.borderDark};
    --motif-card-bg: ${(p: any) => p.theme.cardBg};
    --motif-subcard-bg: ${(p: any) => p.theme.subcardBg};
    --motif-paper-bg: ${(p: any) => p.theme.paperBg};
    --motif-image-filter: ${(p: any) => p.theme.imageFilter};
    --motif-placeholder-bg: ${(p: any) => p.theme.placeholderBg};
    --motif-placeholder-text: ${(p: any) => p.theme.placeholderText};
    --motif-footer-bg: ${(p: any) => p.theme.footerBg};
    --motif-toolbar-bg: ${(p: any) => p.theme.toolbarBg};
    --motif-input-bg: ${(p: any) => p.theme.inputBg};
    --motif-input-bg-focus: ${(p: any) => p.theme.inputBgFocus};
  }

  body {
    margin: 0;
    padding: 0; /* removed outer padding so wallpaper fills edge-to-edge */
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: ${(p: any) => p.theme.desktopBg};
    background-image: url('/wallpaper.svg');
    background-repeat: repeat;
    color: ${(p: any) => p.theme.text};
    font-family: Consolas, 'VT323', monospace;
    font-size: 18px;
  }

  /* motif button class for reuse outside this file */
  .motif-btn {
    background: ${(p: any) => p.theme.titleBarBg};
    color: ${(p: any) => p.theme.titleBarText};
    padding: 6px 12px;
    cursor: pointer;
    border-style: solid;
    border-width: 2px;
    border-top-color: ${(p: any) => p.theme.borderLight};
    border-left-color: ${(p: any) => p.theme.borderLight};
    border-right-color: ${(p: any) => p.theme.borderDark};
    border-bottom-color: ${(p: any) => p.theme.borderDark};
    font-family: Consolas, monospace;
  }
  .motif-btn:hover {
    /* swap to window background and dark text on hover */
    background: ${(p: any) => p.theme.bg};
    color: ${(p: any) => p.theme.text};
  }
  .motif-btn:active {
    border-top-color: ${(p: any) => p.theme.borderDark};
    border-left-color: ${(p: any) => p.theme.borderDark};
    border-right-color: ${(p: any) => p.theme.borderLight};
    border-bottom-color: ${(p: any) => p.theme.borderLight};
    transform: translateY(1px);
  }

  .motif-tag {
    background: ${(p: any) => p.theme.bg};
    padding: 4px 8px;
    border-style: solid;
    border-width: 2px;
    border-top-color: ${(p: any) => p.theme.borderLight};
    border-left-color: ${(p: any) => p.theme.borderLight};
    border-right-color: ${(p: any) => p.theme.borderDark};
    border-bottom-color: ${(p: any) => p.theme.borderDark};
    font-family: Consolas, monospace;
    cursor: pointer;
    font-size: 12px;
    display: inline-block;
    color: ${(p: any) => p.theme.text}; /* ensure dark text */
  }
  .motif-tag:hover { background: ${(p: any) => p.theme.titleBarBg}; color: ${(p:any) => p.theme.text}; }

  /* retro input that matches motif look */
  .motif-input {
    background: ${(p: any) => p.theme.inputBg}; /* more grey */
    color: ${(p: any) => p.theme.text};
    padding: 6px 8px;
    border-style: solid;
    border-width: 2px;
    border-top-color: ${(p: any) => p.theme.borderLight};
    border-left-color: ${(p: any) => p.theme.borderLight};
    border-right-color: ${(p: any) => p.theme.borderDark};
    border-bottom-color: ${(p: any) => p.theme.borderDark};
    font-family: Consolas, monospace;
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
  }

  .motif-input:focus { background: ${(p:any) => p.theme.inputBgFocus}; color: ${(p:any) => p.theme.text}; }

  /* placeholder muted color */
  .motif-input::placeholder { color: ${(p: any) => p.theme.inputPlaceholder}; }

  /* stronger drop shadow on the tiled wallpaper to emulate a compositor */
  .app-wallpaper {
    box-shadow: inset 0 0 40px rgba(0,0,0,0.18), 0 12px 30px rgba(0,0,0,0.45);
    background-repeat: repeat;
    background-position: top left;
  }

  /* Motif-style card class for use in children components */
  .motif-card {
    background: ${(p: any) => p.theme.cardBg};
    border-top: 2px solid ${(p: any) => p.theme.borderLight};
    border-left: 2px solid ${(p: any) => p.theme.borderLight};
    border-right: 2px solid ${(p: any) => p.theme.borderDark};
    border-bottom: 2px solid ${(p: any) => p.theme.borderDark};
    padding: 12px;
    margin-bottom: 12px;
    box-shadow: 1px 1px 0 ${(p: any) => p.theme.borderDarker};
  }

  /* Old-school / Windows 2000 / X11 style scrollbars */
  /* Firefox */
  * {
    scrollbar-width: auto;
    scrollbar-color: #c0c0c0 #e0e0e0;
  }

  /* WebKit (Chrome, Edge, Safari) */
  *::-webkit-scrollbar {
    width: 16px;
    height: 16px;
  }
  *::-webkit-scrollbar-track {
    background: linear-gradient(#e0e0e0, #d0d0d0);
    border-left: 1px solid #ffffff;
  }
  *::-webkit-scrollbar-thumb {
    background: linear-gradient(#c0c0c0, #9a9a9a);
    border: 1px solid #ffffff;
    box-shadow: inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080;
  }
  *::-webkit-scrollbar-button {
    display: block;
    width: 16px;
    height: 16px;
    background: #c0c0c0;
    border-top: 1px solid #ffffff;
    box-shadow: inset 1px 1px 0 #ffffff;
  }

  /* Make scrollbars visually inset so they look 3D */
  *:hover::-webkit-scrollbar-thumb { opacity: 1; }

`;

const outsetBorder = `
  border-style: solid;
  border-width: 2px;
`;

const insetBorder = `
  border-style: solid;
  border-width: 2px;
`;

const Window = styled.div`
  width: calc(100vw - 40px);
  max-width: calc(100vw - 40px);
  height: calc(100vh - 40px);
  background: ${(p: any) => p.theme.bg};
  padding: 3px;
  ${outsetBorder}
  border-top-color: ${(p: any) => p.theme.borderLight};
  border-left-color: ${(p: any) => p.theme.borderLight};
  border-right-color: ${(p: any) => p.theme.borderDark};
  border-bottom-color: ${(p: any) => p.theme.borderDark};
  /* remove external glow/shadow for dark wallpaper; keep subtle inset highlight */
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.02);
  display: flex;
  flex-direction: column;
`;

// Ensure content inside window scrolls if needed
const Content = styled.main`
  flex: 1;
  background: ${(p: any) => p.theme.bg};
  ${insetBorder}
  border-top-color: ${(p: any) => p.theme.borderDark};
  border-left-color: ${(p: any) => p.theme.borderDark};
  border-right-color: ${(p: any) => p.theme.borderLight};
  border-bottom-color: ${(p: any) => p.theme.borderLight};
  padding: 16px;
  overflow: auto;
`;

const TitleBar = styled.div`
  background: ${(p: any) => p.theme.titleBarBg};
  color: ${(p: any) => p.theme.titleBarText};
  padding: 6px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.div`
  font-size: 1rem;
  font-weight: 600;
`;

const Controls = styled.div`
  position: relative;
  display: flex;
  gap: 6px;
`;

const MotifBtn = styled.button`
  background: ${(p: any) => p.theme.titleBarBg};
  color: ${(p: any) => p.theme.titleBarText};
  padding: 6px 12px;
  cursor: pointer;
  ${outsetBorder}
  border-top-color: ${(p: any) => p.theme.borderLight};
  border-left-color: ${(p: any) => p.theme.borderLight};
  border-right-color: ${(p: any) => p.theme.borderDark};
  border-bottom-color: ${(p: any) => p.theme.borderDark};
  font-family: Consolas, monospace;

  &.toolbar-btn {
    @media (max-width: 720px) {
      display: none;
    }
  }

  &.overflow-btn {
    display: none;

    @media (max-width: 720px) {
      display: inline-block;
    }
  }

  &:hover {
    background: ${(p: any) => p.theme.bg};
    color: ${(p: any) => p.theme.text};
  }

  &:active {
    border-top-color: ${(p: any) => p.theme.borderDark};
    border-left-color: ${(p: any) => p.theme.borderDark};
    border-right-color: ${(p: any) => p.theme.borderLight};
    border-bottom-color: ${(p: any) => p.theme.borderLight};
    transform: translateY(1px);
  }
`;

const Toolbar = styled.div`
  display: flex;
  gap: 8px;
  padding: 6px;
  border-bottom: 2px solid ${(p: any) => p.theme.borderDark};
  background: ${(p: any) => p.theme.toolbarBg};
`;

const Footer = styled.footer`
  padding: 4px 8px; /* reduced vertical padding to make footer thinner */
  text-align: center;
  border-top: 2px solid ${(p: any) => p.theme.borderDark};
  background: ${(p: any) => p.theme.footerBg};
  color: ${(p: any) => p.theme.titleBarText};
  font-size: 12px;
  min-height: 36px;

  /* make motif buttons inside footer more compact and vertically centered */
  .motif-btn {
    padding: 4px 6px;
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalWindow = styled.div`
  width: 480px;
  ${outsetBorder}
  padding: 8px;
  background: ${(p: any) => p.theme.bg};
`;

const CardLike = styled.div`
  background: ${(p: any) => p.theme.bg};
  ${insetBorder}
  padding: 12px;
  margin-bottom: 12px;
  border-top-color: ${(p: any) => p.theme.borderDark};
  border-left-color: ${(p: any) => p.theme.borderDark};
  border-right-color: ${(p: any) => p.theme.borderLight};
  border-bottom-color: ${(p: any) => p.theme.borderLight};
  box-shadow: 1px 1px 0 ${(p: any) => p.theme.borderDarker};
`;

const DropdownContainer = styled.div`
  background: ${(p: any) => p.theme.bg};
  padding: 6px;
  border: 2px solid ${(p: any) => p.theme.borderDark};
  box-shadow: 2px 2px 0 rgba(0,0,0,0.45);
  display: flex;
  flex-direction: column;
`;

const DropdownItem = styled.button`
  background: ${(p: any) => p.theme.bg};
  color: ${(p: any) => p.theme.text};
  text-align: left;
  padding: 8px 10px;
  margin: 2px 0;
  cursor: pointer;
  ${outsetBorder}
  border-top-color: ${(p: any) => p.theme.borderLight};
  border-left-color: ${(p: any) => p.theme.borderLight};
  border-right-color: ${(p: any) => p.theme.borderDark};
  border-bottom-color: ${(p: any) => p.theme.borderDark};
  font-family: Consolas, monospace;

  &:hover {
    background: ${(p: any) => p.theme.titleBarBg};
    color: ${(p: any) => p.theme.titleBarText};
  }

  &:active {
    /* inset look when clicked */
    border-top-color: ${(p: any) => p.theme.borderDark};
    border-left-color: ${(p: any) => p.theme.borderDark};
    border-right-color: ${(p: any) => p.theme.borderLight};
    border-bottom-color: ${(p: any) => p.theme.borderLight};
    transform: translateY(1px);
  }
`;

// subtle stripe under titlebar to add retro feel
const TitleBarStripe = styled.div`
  height: 2px;
  background: linear-gradient(90deg, rgba(255,255,255,0.05), rgba(0,0,0,0.05));
`;

export default function MotifLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const location = useLocation();
  // ref for the content area so the "oneko" cat is constrained to it
  const contentRef = useRef<HTMLDivElement | null>(null);
  // read persisted theme if present, default to light
  const [themeName, setThemeName] = useState<'light' | 'dark'>(() => {
    try {
      const v = localStorage.getItem('themeName');
      return v === 'dark' ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  });
  const [isModalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownContentRef = useRef<HTMLDivElement | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ left: number; top: number } | null>(null);

  // toolbar overflow handling
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const overflowBtnRef = useRef<HTMLButtonElement | null>(null);
  const overflowDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isToolbarOverflowing, setToolbarOverflowing] = useState(false);
  const [overflowDropdownOpen, setOverflowDropdownOpen] = useState(false);
  const [overflowDropdownPos, setOverflowDropdownPos] = useState<{ left: number; top: number } | null>(null);
  const [windowIsSmall, setWindowIsSmall] = useState<boolean>(window.innerWidth <= 720);

  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && !(dropdownContentRef.current && dropdownContentRef.current.contains(e.target as Node))) setDropdownOpen(false);
      if (overflowBtnRef.current && !overflowBtnRef.current.contains(e.target as Node) && !(overflowDropdownRef.current && overflowDropdownRef.current.contains(e.target as Node))) setOverflowDropdownOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    const checkOverflow = () => {
      const el = toolbarRef.current;
      if (!el) return setToolbarOverflowing(false);
      // if the total scroll width of the toolbar's children is greater than available width, overflow
      const isOverflow = el.scrollWidth > el.clientWidth - 10; // small buffer
      setToolbarOverflowing(isOverflow);
    };
    checkOverflow();
    const ro = new ResizeObserver(checkOverflow);
    if (toolbarRef.current) ro.observe(toolbarRef.current);
    window.addEventListener('resize', checkOverflow);
    const onResize = () => setWindowIsSmall(window.innerWidth <= 720);
    window.addEventListener('resize', onResize);
    return () => {
      if (toolbarRef.current) ro.disconnect();
      window.removeEventListener('resize', checkOverflow);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const openDropdownAtButton = () => {
    if (menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect();
      const desiredWidth = 220;
      // anchor the dropdown directly under the button's left edge, clamped to viewport
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - desiredWidth - 8));
      setDropdownPos({ left, top: rect.bottom + window.scrollY });
      setDropdownOpen(d => !d);
    } else {
      setDropdownOpen(d => !d);
    }
  };

  const openOverflowDropdown = (anchor?: HTMLButtonElement | null) => {
    const btn = anchor || overflowBtnRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const desiredWidth = 220;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - desiredWidth - 8));
      setOverflowDropdownPos({ left, top: rect.bottom + window.scrollY });
      setOverflowDropdownOpen(d => !d);
    } else {
      setOverflowDropdownOpen(d => !d);
    }
  };

  const theme = themeName === 'light' ? lightTheme : darkTheme;

  // ensure favicon is set from public/ and keep in sync
  useEffect(() => {
    try {
      const href = '/aradhyac_favicon.png';
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      if (link.href !== location.origin + href) link.href = href;
    } catch (e) {}
  }, []);

  // Toggle theme and persist selection
  const toggleTheme = () => {
    setThemeName((prev) => {
      const nv = prev === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('themeName', nv); } catch (e) {}
      return nv as 'light' | 'dark';
    });
  };
  
  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccessOpen, setContactSuccessOpen] = useState(false);
  const [contactErrors, setContactErrors] = useState<{ name?: string; email?: string; message?: string; submit?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCsrfToken = () => {
    try {
      const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
      if (meta && meta.content) return meta.content;
      const match = document.cookie.match(/(?:^|; )csrf_token=([^;]+)/);
      return match ? decodeURIComponent(match[1]) : '';
    } catch (e) { return ''; }
  };

  // Oneko (cursor-cat) toggle (default on)
  const [onekoEnabled, setOnekoEnabled] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('onekoEnabled');
      return v === null ? true : v === 'true';
    } catch (e) {
      return true;
    }
  });
  const toggleOneko = () => {
    setOnekoEnabled((v) => {
      const nv = !v;
      try { localStorage.setItem('onekoEnabled', nv ? 'true' : 'false'); } catch (e) {}
      return nv;
    });
  };

  // --- Oneko integration (moved to separate file) ---
  // start/stop handle from external util
  const onekoHandleRef = useRef<null | { stop: () => void }>(null);
  useEffect(() => {
    // lazy import so SSR doesn't crash
    let mounted = true;
    if (onekoEnabled && contentRef.current) {
      import('../utils/oneko').then((mod) => {
        if (!mounted) return;
        const stop = mod.startOneko(contentRef.current as HTMLElement, { catUrl: '/oneko.gif', size: 32 });
        onekoHandleRef.current = { stop };
      }).catch(() => {});
    } else {
      // stop if exists
      try { onekoHandleRef.current && onekoHandleRef.current.stop(); } catch (e) {}
      onekoHandleRef.current = null;
    }
    return () => {
      mounted = false;
      try { onekoHandleRef.current && onekoHandleRef.current.stop(); } catch (e) {}
      onekoHandleRef.current = null;
    };
  }, [onekoEnabled, contentRef]);

  // --- ADMIN AUTH ---
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try { return localStorage.getItem('adminAuthenticated') === 'true'; } catch (e) { return false; }
  });
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Module-level guard so session check only happens once per page load (avoids StrictMode double-fetch)
  let __adminSessionChecked = (typeof window !== 'undefined' && (window as any).__adminSessionChecked) || false;
  if (typeof window !== 'undefined' && !(window as any).__adminSessionChecked) (window as any).__adminSessionChecked = __adminSessionChecked;

  // verify session on mount (coalesced)
  useEffect(() => {
    let mounted = true;
    // if another instance already checked session this page load, read the result from localStorage
    if (__adminSessionChecked) {
      try {
        const auth = localStorage.getItem('adminAuthenticated') === 'true';
        setIsAdminAuthenticated(auth);
        setAuthChecked && setAuthChecked(true); // noop if state doesn't exist here
      } catch (e) {}
      return;
    }

    __adminSessionChecked = true;
    try { if (typeof window !== 'undefined') (window as any).__adminSessionChecked = true; } catch (e) {}

    (async () => {
      try {
        const resp = await fetch('/api/admin/session', { method: 'GET', credentials: 'include' });
        if (!mounted) return;
        if (resp.ok) {
          const j = await resp.json();
          if (j && j.authenticated) {
            setIsAdminAuthenticated(true);
            try { localStorage.setItem('adminAuthenticated', 'true'); } catch (e) {}
          } else {
            setIsAdminAuthenticated(false);
            try { localStorage.removeItem('adminAuthenticated'); } catch (e) {}
          }
        } else {
          setIsAdminAuthenticated(false);
          try { localStorage.removeItem('adminAuthenticated'); } catch (e) {}
        }
      } catch (e) {
        setIsAdminAuthenticated(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const openLogin = () => {
    setLoginError(null);
    setLoginUser('');
    setLoginPass('');
    setLoginOpen(true);
  };
  
  const doLogin = async () => {
    setLoginError(null);
    try {
      const resp = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: loginUser, password: loginPass })
      });
      if (resp.ok) {
        const j = await resp.json();
        if (j && j.success) {
          setIsAdminAuthenticated(true);
          try { localStorage.setItem('adminAuthenticated', 'true'); } catch(e){}
          setLoginOpen(false);
          setLoginError(null);
          // navigate to admin
          navigate('/admin');
          return;
        }
        setLoginError(j && j.message ? j.message : 'Invalid username or password');
      } else {
        const j = await resp.json().catch(() => null);
        setLoginError(j && j.message ? j.message : 'Invalid username or password');
      }
    } catch (e) {
      setLoginError('Unable to contact server');
    }
  };

  const handleAdminMenu = () => {
    if (isAdminAuthenticated) {
      navigate('/admin');
    } else {
      openLogin();
    }
  };

  // Contact modal open/close helpers (re-added)
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  // Contact form submit handler
  const handleContactSubmit = async (e: any) => {
    try {
      e && e.preventDefault();
      setContactErrors({});
      // Basic client-side validation
      const name = (contactName || '').trim();
      const email = (contactEmail || '').trim();
      const message = (contactMessage || '').trim();

      const errors: typeof contactErrors = {};
      if (!name) errors.name = 'Name is required';
      if (!email) errors.email = 'Email is required';
      if (!message) errors.message = 'Message is required';
      if (name && name.length > 200) errors.name = 'Name is too long';
      if (email && email.length > 200) errors.email = 'Email is too long';
      if (message && message.length > 2000) errors.message = 'Message is too long';
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRe.test(email)) errors.email = 'Email appears invalid';
      if (Object.keys(errors).length) { setContactErrors(errors); return; }

      // basic client-side sanitization: strip suspicious SQL/meta characters
      const sanitize = (s: string) => s.replace(/[<>`]/g, '').replace(/--/g, '').replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\b/gi, '');

      const payload = { name: sanitize(name), email: sanitize(email), message: sanitize(message) };
      setIsSubmitting(true);
      const headers: any = { 'Content-Type': 'application/json' };
      const csrf = getCsrfToken();
      if (csrf) headers['X-CSRF-Token'] = csrf;

      const resp = await fetch('/api/contact', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        try { setContactName(''); setContactEmail(''); setContactMessage(''); } catch (e) {}
        // close modal and give feedback
        setModalOpen(false);
        // show motif-styled confirmation
        setContactSuccessOpen(true);
      } else {
        const txt = await resp.text().catch(() => null);
        console.error('Contact submit failed', txt);
        setContactErrors({ submit: 'Unable to send message' });
      }
    } catch (err) {
      console.error('Error submitting contact form', err);
      setContactErrors({ submit: 'Unable to send message' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Blog search effect
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q');
    if (q) {
      // fetch first page when a query is present; detailed search handling lives on BlogPage
      dispatch(fetchBlogs(1));
    } else {
      dispatch(clearBlogSearch());
    }
  }, [location.search, dispatch]);

  useEffect(() => {
    // if redirected with state to request admin login, open the login modal
    try {
      const st: any = (location as any).state;
      if (st && st.adminLogin) {
        openLogin();
        // clear the navigation state so it doesn't reopen repeatedly
        navigate(location.pathname, { replace: true, state: {} });
      }
    } catch (e) {}
  }, [location.key]);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Window>
        <TitleBar>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/aradhyac_favicon.png" alt="logo" style={{ width: 20, height: 20, display: 'block' }} />
            <Title>ARADHYA'S SPACE</Title>
          </div>
          <Controls ref={dropdownRef}>
            <MotifBtn ref={menuBtnRef as any} onClick={openDropdownAtButton}>Menu ▾</MotifBtn>
            {dropdownOpen && (
              <div ref={dropdownContentRef} style={{ position: 'absolute', right: 0, top: '100%', zIndex: 2000, width: 260 }}>
                <DropdownContainer>
                  <DropdownItem onClick={() => { toggleTheme(); setDropdownOpen(false); }}>Toggle {themeName === 'light' ? 'Dark' : 'Light'}</DropdownItem>
                  <DropdownItem onClick={() => { toggleOneko(); setDropdownOpen(false); }}>Toggle Oneko: {onekoEnabled ? 'On' : 'Off'}</DropdownItem>
                  <DropdownItem onClick={() => { handleAdminMenu(); setDropdownOpen(false); }}>Admin</DropdownItem>
                </DropdownContainer>
              </div>
            )}
          </Controls>
        </TitleBar>

        <TitleBarStripe />

        <Toolbar ref={toolbarRef}>
          <MotifBtn onClick={() => { dispatch(clearBlogSearch()); if (location.pathname === '/') { dispatch(fetchBlogs(1)); } navigate('/'); }} className="toolbar-btn">Blog</MotifBtn>
          <MotifBtn onClick={() => navigate('/projects')} className="toolbar-btn">Projects</MotifBtn>
          <MotifBtn onClick={() => navigate('/about')} className="toolbar-btn">About</MotifBtn>

          <MotifBtn
            ref={overflowBtnRef as any}
            className="overflow-btn"
            onClick={() => openOverflowDropdown(overflowBtnRef.current)}
            style={{ display: windowIsSmall ? 'inline-block' : 'none' }}
          >▾</MotifBtn>

          {overflowDropdownOpen && overflowDropdownPos && (
            <div ref={overflowDropdownRef} style={{ position: 'absolute', left: overflowDropdownPos.left, top: overflowDropdownPos.top, zIndex: 2000 }}>
              <DropdownContainer>
                <DropdownItem onClick={() => { dispatch(clearBlogSearch()); if (location.pathname === '/') { dispatch(fetchBlogs(1)); } navigate('/'); setOverflowDropdownOpen(false); }}>Blog</DropdownItem>
                <DropdownItem onClick={() => { navigate('/projects'); setOverflowDropdownOpen(false); }}>Projects</DropdownItem>
                <DropdownItem onClick={() => { navigate('/about'); setOverflowDropdownOpen(false); }}>About</DropdownItem>
              </DropdownContainer>
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* search removed per user request */}

        </Toolbar>

        <Content ref={contentRef as any} style={{ position: 'relative' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '8px' }}>
            {children}
          </div>
        </Content>

        <Footer>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <small style={{ color: '#ffffff', fontFamily: 'Consolas, monospace', fontWeight: 700, fontSize: '13px' }}>© 2025 Aradhya Chakrabarti</small>
            </div>
            <div style={{ flex: 1, textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 8 }}>
              <a className="motif-btn" href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" title="GitHub" style={{ padding: '4px 8px' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M8 .198a8 8 0 00-2.53 15.59c.4.074.546-.174.546-.388 0-.192-.007-.70-.01-1.37-2.22.484-2.69-1.07-2.69-1.07-.363-.923-.887-1.17-.887-1.17-.726-.497.055-.487.055-.487.803.056 1.225.825 1.225.825.714 1.223 1.872.87 2.33.666.072-.517.28-.87.51-1.07-1.77-.2-3.63-.885-3.63-3.943 0-.872.312-1.586.824-2.146-.083-.202-.357-1.015.078-2.116 0 0 .672-.215 2.2.82a7.6 7.6 0 012.004-.27c.68.003 1.366.092 2.004.27 1.527-1.035 2.198-.82 2.198-.82.437 1.101.163 1.914.08 2.116.513.56.823 1.274.823 2.146 0 3.07-1.864 3.74-3.64 3.936.288.248.543.736.543 1.484 0 1.072-.01 1.936-.01 2.2 0 .216.144.466.55.387A8.001 8.001 0 008 .198z" fill="#ffffff"/></svg>
              </a>
              <a className="motif-btn" href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" style={{ padding: '4px 8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.98 3.5a2.5 2.5 0 11-.002 5.002A2.5 2.5 0 014.98 3.5zM3 9h4v12H3zM9 9h3.8v1.61h.05c.53-.99 1.82-2.03 3.75-2.03 4.01 0 4.75 2.64 4.75 6.06V21h-4v-5.25c0-1.25-.02-2.86-1.74-2.86-1.74 0-2.01 1.36-2.01 2.76V21H9V9z" fill="#ffffff"/></svg>
              </a>
              <a className="motif-btn" href={SOCIAL_LINKS.scholar} target="_blank" rel="noopener noreferrer" title="Google Scholar" style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                {/* Google Scholar icon (white/gray-only) */}
                <svg width="16" height="16" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                  <path fill="#ffffff" d="M256 411.12L0 202.667 256 0z"/>
                  <path fill="#d0d0d0" d="M256 411.12l256-208.453L256 0z"/>
                  <circle fill="#bfbfbf" cx="256" cy="362.667" r="149.333"/>
                  <path fill="#e6e6e6" d="M121.037 298.667c23.968-50.453 75.392-85.334 134.963-85.334s110.995 34.881 134.963 85.334H121.037z"/>
                </svg>
              </a>
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <MotifBtn onClick={openModal}>Contact</MotifBtn>
            </div>
          </div>
         </Footer>

        {isModalOpen && (
          <ModalOverlay onClick={closeModal} style={{ zIndex: 3000 }}>
            <ModalWindow onClick={(e) => e.stopPropagation()} style={{ width: 'min(92vw, 520px)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.titleBarBg, color: theme.titleBarText, padding: '6px 8px' }}>
                <div>Contact</div>
                <MotifBtn onClick={closeModal}>X</MotifBtn>
              </div>
              <form onSubmit={handleContactSubmit} style={{ padding: 8, maxHeight: '80vh', overflow: 'auto' }}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 4, color: 'var(--motif-text)' }}>Name</label>
                  <input value={contactName} onChange={(e) => setContactName(e.target.value)} className="motif-input" style={{ width: '100%' }} />
                  {contactErrors.name && <div style={{ color: '#c0392b', fontSize: 12, marginTop: 6 }}>{contactErrors.name}</div>}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 4, color: 'var(--motif-text)' }}>Email</label>
                  <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="motif-input" style={{ width: '100%' }} />
                  {contactErrors.email && <div style={{ color: '#c0392b', fontSize: 12, marginTop: 6 }}>{contactErrors.email}</div>}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 4, color: 'var(--motif-text)' }}>Message</label>
                  <textarea value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} className="motif-input" style={{ width: '100%', minHeight: '100px' }} />
                  {contactErrors.message && <div style={{ color: '#c0392b', fontSize: 12, marginTop: 6 }}>{contactErrors.message}</div>}
                </div>
                {contactErrors.submit && <div style={{ color: '#c0392b', fontSize: 13, marginBottom: 8 }}>{contactErrors.submit}</div>}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                  <MotifBtn type="submit" disabled={isSubmitting} style={isSubmitting ? { opacity: 0.6, pointerEvents: 'none' } : {}}> {isSubmitting ? 'Sending...' : 'Submit'}</MotifBtn>
                  <MotifBtn type="button" onClick={closeModal}>Close</MotifBtn>
                </div>
              </form>
            </ModalWindow>
          </ModalOverlay>
        )}

        {/* Contact success modal (motif-styled) */}
        {contactSuccessOpen && (
          <ModalOverlay onClick={() => setContactSuccessOpen(false)} style={{ zIndex: 3600 }}>
            <ModalWindow onClick={(e) => e.stopPropagation()} style={{ width: 'min(80vw, 420px)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: theme.titleBarBg, color: theme.titleBarText, padding: '6px 8px' }}>
                <div>Message Sent</div>
                <MotifBtn onClick={() => setContactSuccessOpen(false)}>X</MotifBtn>
              </div>
              <div style={{ padding: 12, color: 'var(--motif-text)' }}>
                <Typography variant="body1">Thank you for your message. We will get back to you shortly.</Typography>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                  <MotifBtn onClick={() => setContactSuccessOpen(false)}>Close</MotifBtn>
                </div>
              </div>
            </ModalWindow>
          </ModalOverlay>
        )}

        {/* Login modal for admin credentials - motif-styled */}
        {loginOpen && (
          <ModalOverlay onClick={() => setLoginOpen(false)} style={{ zIndex: 3500 }}>
            <ModalWindow onClick={(e) => e.stopPropagation()} style={{ width: 'min(92vw, 420px)', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--motif-titlebar-bg)', color: 'var(--motif-titlebar-text)', padding: '6px 8px' }}>
                <div style={{ color: 'var(--motif-titlebar-text)', fontWeight: 700 }}>Admin Login</div>
                <div className="motif-btn" onClick={closeModal} style={{ borderRadius: 8, padding: '6px 8px' }}>◯</div>
              </div>
              <div style={{ padding: 8 }}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>Username</label>
                  <input value={loginUser} onChange={(e) => setLoginUser(e.target.value)} className="motif-input" style={{ width: '100%' }} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>Password</label>
                  <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="motif-input" style={{ width: '100%' }} />
                </div>
                {loginError && <div style={{ color: 'crimson', marginBottom: 8, fontFamily: 'Consolas, monospace' }}>{loginError}</div>}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                  <MotifBtn onClick={doLogin}>Login</MotifBtn>
                  <MotifBtn onClick={() => setLoginOpen(false)}>Cancel</MotifBtn>
                </div>
              </div>
            </ModalWindow>
          </ModalOverlay>
        )}

      </Window>
    </ThemeProvider>
  );
}
