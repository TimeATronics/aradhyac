// @ts-ignore
import React, { useEffect, useState } from 'react';
import { Typography, Box } from '@mui/material';

function RepoCard({ repo }: { repo: any }) {
  // derive a hue per repo for distinct but darker cards
  const nameStr = String(repo.full_name || repo.html_url || '');
  const hash = Array.from(nameStr).reduce((h: number, ch: string) => (h << 5) - h + ch.charCodeAt(0), 0);
  const hue = Math.abs(hash) % 360;
  const bg = `linear-gradient(135deg, hsl(${hue} 40% 36%), hsl(${(hue + 20) % 360} 40% 30%))`;

  const open = () => window.open(repo.html_url, '_blank');

  return (
    <div
      className="motif-card"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }}
      onClick={open}
      style={{ cursor: 'pointer', background: bg, color: 'var(--motif-text)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 130, boxSizing: 'border-box', width: '100%', minWidth: 0, overflow: 'hidden' }}
    >
      {/* make the growing column able to shrink so it doesn't push the footer */}
      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 0', minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
        <div>
          <div className="motif-subcard" style={{ padding: 8, background: 'var(--motif-subcard-bg)', boxSizing: 'border-box', overflow: 'hidden', width: '100%', marginBottom: 8 }}>
            <div
              style={{
                fontFamily: 'Consolas, monospace',
                fontWeight: 700,
                color: 'var(--motif-text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
                maxWidth: '100%',
                display: 'block'
              }}
              title={repo.full_name}
            >{repo.full_name}</div>

            {/* single-line description with ellipsis and constrained width; force one line height even if empty */}
            <div
              style={{
                fontSize: 13,
                color: 'var(--motif-text)',
                marginTop: 6,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
                maxWidth: '100%',
                display: 'block',
                lineHeight: '1em',
                minHeight: 18
              }}
              title={repo.description || ''}
            >{repo.description || ''}</div>
          </div>
        </div>
      </div>

      {/* footer anchored to bottom with a subtle divider and extra spacing so it sits near the bottom */}
      <div style={{ padding: '14px 10px 12px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', minHeight: 48 }}>
        {/* timestamp forced to white so it remains visible regardless of theme */}
        <div style={{ fontFamily: 'Consolas, monospace', fontSize: 12, color: '#fff' }}>{repo.updated_at ? new Date(repo.updated_at).toLocaleString() : '—'}</div>
        <a href={repo.html_url} target="_blank" rel="noreferrer" className="motif-tag" style={{ fontFamily: 'Consolas, monospace', fontSize: 12 }}>Open</a>
      </div>
    </div>
  );
}

function ProjectsPage() {
  const [repos, setRepos] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const perPage = 4; // 2 columns x 2 rows

  const fetchPage = async (p: number) => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/projects?page=${p}&per_page=${perPage}`);
      if (!resp.ok) throw new Error('Failed');
      const j = await resp.json();
      setRepos(j.items || []);
      setTotal(j.total || 0);
      setPage(j.page || p);
    } catch (e) {
      console.error(e);
      setMessage('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPage(1); }, []);

  const refresh = async () => {
    setRefreshing(true);
    setMessage(null);
    try {
      const resp = await fetch('/api/projects/refresh', { method: 'POST' });
      if (!resp.ok) throw new Error('refresh failed');
      const j = await resp.json();
      // show simple feedback
      setMessage(`Refreshed: created=${j.created || 0} updated=${j.updated || 0}`);
      await fetchPage(1);
    } catch (e) {
      console.error(e);
      setMessage('Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((total || 0) / perPage));

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'var(--motif-text)' }}>Projects</Typography>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="motif-btn" onClick={refresh} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh'}</button>
        </div>
      </div>

      <Typography variant="h5" sx={{ color: 'var(--motif-text)', mt: 2, mb: 1 }}>Github Repositories</Typography>
      {message && <div style={{ marginBottom: 8, color: 'var(--motif-text)' }}>{message}</div>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        {loading ? (
          <div className="motif-card" style={{ padding: 12 }}>Loading...</div>
        ) : (
          repos.map(r => <RepoCard key={r.id} repo={r} />)
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
        <button className="motif-btn" disabled={page <= 1} onClick={() => fetchPage(page - 1)} style={{ opacity: page <= 1 ? 0.5 : 1 }}>Prev</button>
        <Typography sx={{ alignSelf: 'center', color: 'var(--motif-text)' }}>{page} / {totalPages}</Typography>
        <button className="motif-btn" disabled={page >= totalPages} onClick={() => fetchPage(page + 1)} style={{ opacity: page >= totalPages ? 0.5 : 1 }}>Next</button>
      </Box>

      <div style={{ height: 24 }} />
      <Typography variant="h5" sx={{ color: 'var(--motif-text)', mt: 2, mb: 1 }}>Hosted Projects</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <div className="motif-card" style={{ padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 130, boxSizing: 'border-box' }}>
          <Typography variant="h6" sx={{ color: 'var(--motif-text)', textAlign: 'center' }}>Coming Soon</Typography>
        </div>
        <div className="motif-card" style={{ padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 130, boxSizing: 'border-box' }}>
          <Typography variant="h6" sx={{ color: 'var(--motif-text)', textAlign: 'center' }}>Coming Soon</Typography>
        </div>
      </Box>
    </Box>
  );
}

export default ProjectsPage;
