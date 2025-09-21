// shared HeroImage used by BlogPage and AdminPage
import { useEffect, useState } from 'react';

interface Props { src: string; height?: number }

export default function HeroImage({ src, height = 110 }: Props) {
  const [url, setUrl] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  // consider remote if it starts with protocol or a leading //
  const isRemote = /^(https?:)?\/\//i.test(src);

  useEffect(() => {
    let mounted = true;
    setLoaded(false);
    setUrl('');
    if (!src) return;
    if (isRemote) {
      // remote url - use it directly
      if (mounted) setUrl(src);
      return () => { mounted = false; };
    }
    // otherwise request presigned URL
    fetch(`/api/media/download-url/${encodeURIComponent(src)}`)
      .then(r => r.json())
      .then(j => { if (!mounted) return; if (j && j.url) setUrl(j.url); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [src]);

  if (!src) return null;

  return (
    <div style={{ width: '100%', height, position: 'relative', display: 'block', overflow: 'hidden', background: 'var(--motif-placeholder-bg)' }}>
      {/* placeholder shown until image loads */}
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--motif-placeholder-text)', fontWeight: 700 }}>
          Loading...
        </div>
      )}
      {url ? (
        <img
          src={url}
          alt="hero"
          onLoad={() => setLoaded(true)}
          onError={() => { setLoaded(false); setUrl(''); }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: loaded ? 'block' : 'none', transition: 'opacity 240ms ease-in', opacity: loaded ? 1 : 0 }}
        />
      ) : null}
    </div>
  );
}
