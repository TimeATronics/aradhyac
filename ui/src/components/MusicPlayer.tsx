// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from 'styled-components';

type Asset = { id: number; file_name: string; file_type: string; use_type?: string };

export default function MusicPlayer({ compact }: { compact?: boolean }) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMobile, setIsMobile] = useState<boolean>(() => (typeof window !== 'undefined') ? window.matchMedia('(max-width:720px)').matches : false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width:720px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile((e as any).matches);
    // support both modern and older APIs
    if (mq.addEventListener) mq.addEventListener('change', handler as EventListener);
    else mq.addListener(handler as any);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler as EventListener);
      else mq.removeListener(handler as any);
    };
  }, []);

  // theme / dark-mode detection
  const theme = useTheme ? (useTheme() as any) : null;
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      // check styled-components theme hints
      if (typeof theme !== 'undefined' && theme) {
        if (theme.mode === 'dark' || theme.isDark) return true;
      }
      // check document-level attributes or classes used by apps for toggling
      if (document.documentElement.getAttribute('data-theme') === 'dark') return true;
      if (document.body.classList.contains('dark') || document.documentElement.classList.contains('dark')) return true;
      // fallback to prefers-color-scheme
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsDarkTheme((e as any).matches);
    if (mq) {
      if (mq.addEventListener) mq.addEventListener('change', handler as EventListener);
      else mq.addListener(handler as any);
    }
    // also observe attribute/class changes for documentElement as a best-effort
    const obs = new MutationObserver(() => {
      const hasDarkAttr = document.documentElement.getAttribute('data-theme') === 'dark';
      const hasDarkClass = document.body.classList.contains('dark') || document.documentElement.classList.contains('dark');
      const themeHint = typeof theme !== 'undefined' && theme && (theme.mode === 'dark' || theme.isDark);
      setIsDarkTheme(Boolean(themeHint || hasDarkAttr || hasDarkClass || (mq && (mq as any).matches)));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    obs.observe(document.body, { attributes: true });
    return () => {
      if (mq) {
        if (mq.removeEventListener) mq.removeEventListener('change', handler as EventListener);
        else mq.removeListener(handler as any);
      }
      obs.disconnect();
    };
  }, [theme]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      if (audioRef.current && !isNaN(audioRef.current.currentTime)) {
        setTime(audioRef.current.currentTime);
        setDuration(audioRef.current.duration || 0);
      }
    }, 200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selectedUrl) { setMetadata(null); setPlaying(false); return; }
    try {
      import('jsmediatags/dist/jsmediatags.min.js')
        .then((mod) => {
          const j = (mod && (mod.default || mod.jsmediatags)) || mod;
          if (j && typeof j.read === 'function') {
            j.read(selectedUrl, {
              onSuccess: (tag: any) => setMetadata(tag.tags),
              onError: () => setMetadata(null)
            });
          } else {
            setMetadata(null);
          }
        })
        .catch(() => setMetadata(null));
    } catch (e) { setMetadata(null); }
  }, [selectedUrl]);

  const openPicker = async () => {
    setPickerError(null);
    setPickerOpen(true);
    if (assets) return;
    setLoadingAssets(true);
    try {
      const resp = await fetch('/api/s3-assets');
      if (!resp.ok) throw new Error('Failed to load assets');
      const list: Asset[] = await resp.json();
      // filter for music/ prefix and audio mime types
      const filtered = list.filter(a => a.file_name && a.file_name.startsWith('music/') && /^audio\//i.test(a.file_type || ''));
      setAssets(filtered);
    } catch (e) {
      setPickerError('Unable to load assets');
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  const selectAsset = async (asset: Asset) => {
    // fetch presigned URL
    try {
      const resp = await fetch(`/api/media/download-url/${encodeURIComponent(asset.file_name)}`);
      if (!resp.ok) throw new Error('Could not get URL');
      const j = await resp.json();
      if (j && j.url) {
        setSelectedAsset(asset);
        setSelectedUrl(j.url);
        setPickerOpen(false);
      } else {
        setPickerError('Invalid URL from server');
      }
    } catch (e) {
      setPickerError('Failed to fetch download URL');
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setPlaying(true); }
  };

  const onSeek = (v: number) => {
    if (audioRef.current) audioRef.current.currentTime = v;
  };

  const effectiveCompact = Boolean(compact && isMobile);

  const formatTime = (s: number) => {
    if (!s || isNaN(s) || s <= 0) return '0:00';
    return `${Math.floor(s / 60)}:${('0' + Math.floor(s % 60)).slice(-2)}`;
  };

  // derive display title/artist from metadata (support common ID3 keys)
  const getTag = (m: any, keys: string[]) => {
    if (!m) return null;
    for (const k of keys) if (m[k]) return m[k];
    return null;
  };
  const displayTitle = getTag(metadata, ['title', 'TIT2', 'TIT3', 'TIT1']) || (selectedAsset ? selectedAsset.file_name.split('/').pop() : 'Select music to play');
  const displayArtist = getTag(metadata, ['artist', 'TPE1', 'TPE2', 'artist']) || null;

  // Use the motif theme CSS variables defined in MotifLayout so the player inherits app theme correctly
  // prefer using CSS variables (they will be set by the ThemeProvider / GlobalStyle)
  return (
    <div className="motif-card" style={{ padding: 12, background: 'var(--motif-card-bg)', color: 'var(--motif-text)' }}>
      {/* If effectiveCompact (compact prop + mobile viewport), show controls above and slider below. Otherwise keep inline layout for desktop/non-compact. */}
      {effectiveCompact ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="motif-btn" onClick={openPicker} aria-haspopup="dialog" aria-expanded={pickerOpen}>{selectedAsset ? 'Change' : 'Select music'}</button>
              <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button className="motif-btn" onClick={togglePlay} aria-pressed={isPlaying}>{isPlaying ? '▮▮' : '▶'}</button>
              </div>
            </div>
            <div style={{ width: '100%' }}>
              <div style={{ fontFamily: 'Consolas, monospace', fontSize: 13, color: 'var(--motif-text)' }}>
                <div style={{ fontWeight: 700 }}>{displayTitle}</div>
                {displayArtist && <div style={{ fontSize: 12, opacity: 0.8 }}>{displayArtist}</div>}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ height: 18, background: 'var(--motif-subcard-bg)', border: '2px solid var(--motif-border-dark)', boxSizing: 'border-box' }}>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={time}
                onChange={(e) => onSeek(Number(e.target.value))}
                style={{ width: '100%' }}
                aria-label="seek"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Consolas, monospace', fontSize: 12, marginTop: 6, color: 'var(--motif-text)' }}>
              <div>{formatTime(time)}</div>
              <div>{formatTime(duration)}</div>
            </div>
          </div>
        </>
      ) : (
        // non-compact (desktop or when compact not desired): inline controls with slider and time labels under the slider (single line)
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="motif-btn" onClick={openPicker} aria-haspopup="dialog" aria-expanded={pickerOpen}>{selectedAsset ? 'Change' : 'Select music'}</button>
            <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button className="motif-btn" onClick={togglePlay} aria-pressed={isPlaying}>{isPlaying ? '▮▮' : '▶'}</button>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Consolas, monospace', fontSize: 13, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--motif-text)' }}>
              <div style={{ fontWeight: 700 }}>{displayTitle}</div>
              {displayArtist && <div style={{ fontSize: 12, opacity: 0.85 }}>{displayArtist}</div>}
            </div>
            <div>
              <div style={{ height: 18, background: 'var(--motif-subcard-bg)', border: '2px solid var(--motif-border-dark)', boxSizing: 'border-box' }}>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={time}
                  onChange={(e) => onSeek(Number(e.target.value))}
                  style={{ width: '100%' }}
                  aria-label="seek"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Consolas, monospace', fontSize: 12, marginTop: 6, color: 'var(--motif-text)' }}>
                <div>{formatTime(time)}</div>
                <div>{formatTime(duration)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Picker modal */}
      {pickerOpen && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000 }} onClick={() => setPickerOpen(false)}>
          <div role="document" onClick={(e) => e.stopPropagation()} style={{ width: 'min(90vw,600px)', maxHeight: '70vh', overflow: 'auto', background: 'var(--motif-paper-bg)', color: 'var(--motif-text)', padding: 12, border: '2px solid var(--motif-border-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>Select Music from Assets</div>
              <button className="motif-btn" onClick={() => setPickerOpen(false)}>Close</button>
            </div>
            {loadingAssets && <div>Loading...</div>}
            {pickerError && <div style={{ color: 'crimson' }}>{pickerError}</div>}
            {!loadingAssets && assets && assets.length === 0 && <div>No audio assets found (ensure files are under music/ and type audio/*)</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {assets && assets.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, border: '1px solid rgba(0,0,0,0.08)', background: 'var(--motif-subcard-bg)' }} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') selectAsset(a); }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontFamily: 'Consolas, monospace', fontWeight: 700, color: 'var(--motif-text)' }}>{a.file_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--motif-text)', opacity: 0.85 }}>{a.file_type}</div>
                  </div>
                  <div>
                    <button className="motif-btn" onClick={() => selectAsset(a)}>Use</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedUrl && <audio ref={audioRef} src={selectedUrl} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)} />}
    </div>
  );
}
