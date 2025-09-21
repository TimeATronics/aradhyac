// @ts-ignore
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Typography, Box } from '@mui/material';
import { fetchBlogs, searchBlogs } from '../store/actions/blogActions';
import HeroImage from '../components/HeroImage';
import './responsive-overrides.css';

// Small TagOverflow helper (matches BlogPage behavior) so admin overflow works the same
const TagOverflow: React.FC<{ tags: string[]; onTagClick: (t: string) => void }> = ({ tags, onTagClick }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
      <div
        role="button"
        tabIndex={0}
        className="motif-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setOpen(o => !o); } }}
        style={{ height: 28, minWidth: 32, padding: '0 6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        aria-label="more-tags"
      >▾</div>
      <div style={{ display: open ? 'block' : 'none', position: 'absolute', right: 0, top: 36, zIndex: 3000 }}>
        <div style={{ background: 'var(--motif-subcard-bg)', padding: 6, border: `2px solid var(--motif-border-dark)` }}>
          {tags.map((t: string, idx: number) => (
            <div key={`all-${t}-${idx}`} style={{ marginBottom: 6 }}>
              <div
                role="button"
                tabIndex={0}
                className="motif-tag"
                onClick={(ev) => { ev.stopPropagation(); onTagClick(t); setOpen(false); }}
                onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); onTagClick(t); setOpen(false); } }}
                style={{ background: ((): string => { let h = 0; for (let i = 0; i < t.length; i++) h = (h << 5) - h + t.charCodeAt(i); const hue = Math.abs(h) % 360; return `hsl(${hue}, 55%, 76%)`; })(), color: '#000', maxWidth: 200, overflow: 'hidden' }}
              >
                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{t}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface Blog {
  id: number;
  title: string;
  content: string;
  tags: string | string[];
  created_at?: string;
  author?: string;
  hero_image?: string;
}

// S3 Image picker component used inside the add/edit modal
const S3ImagePicker: React.FC<{
  open: boolean;
  onClose: () => void;
  onSelect?: (fileName: string) => void;
  onSetHero?: (fileName: string) => void;
}> = ({ open, onClose, onSelect, onSetHero }) => {
  const [assets, setAssets] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    fetch('/api/s3-assets').then(r => r.json()).then((j) => {
      if (!mounted) return;
      // Only show blog_images/ assets in the blog image picker
      const all = Array.isArray(j) ? j : [];
      const filteredByPrefix = all.filter((a: any) => (a.file_name || '').startsWith('blog_images/'));
      setAssets(filteredByPrefix);
    }).catch(() => { if (mounted) setAssets([]); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [open]);

  const filtered = assets.filter(a => !q || (a.file_name || '').toLowerCase().includes(q.toLowerCase())).slice(0, 5);

  return (
    <div style={{ display: open ? 'block' : 'none', position: 'fixed', inset: 0, zIndex: 5000 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(92vw,600px)', margin: '6vh auto', background: 'var(--motif-bg)', padding: 8, border: '2px solid var(--motif-border-dark)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--motif-titlebar-bg)', color: 'var(--motif-titlebar-text)', padding: '6px 8px' }}>
          <div style={{ fontWeight: 700 }}>Insert Image from S3</div>
          <div className="motif-btn" onClick={onClose} style={{ borderRadius: 8, padding: '6px 8px' }} aria-label="Close">✕</div>
        </div>
        <div style={{ padding: 8 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search images" className="motif-input" style={{ width: '100%', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
            {loading && <div>Loading...</div>}
            {!loading && filtered.length === 0 && <div style={{ color: 'gray' }}>No images</div>}
            {filtered.map((a) => (
              <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <S3AssetPreview fileName={a.file_name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Consolas, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.file_name}>{a.file_name}</div>
                </div>
                <div className="motif-btn" onClick={() => { onSelect && onSelect(a.file_name); onClose(); }} style={{ cursor: 'pointer' }}>Insert</div>
                <div className="motif-btn" onClick={() => { onSetHero && onSetHero(a.file_name); }} style={{ cursor: 'pointer' }}>Set as Hero</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// small preview component that resolves presigned URL for an S3 asset
const S3AssetPreview: React.FC<{ fileName: string }> = ({ fileName }) => {
  const [url, setUrl] = useState<string>('');
  useEffect(() => {
    let mounted = true;
    if (!fileName) return;
    fetch(`/api/media/download-url/${encodeURIComponent(fileName)}`).then(r => r.json()).then(j => {
      if (!mounted) return;
      if (j && j.url) setUrl(j.url);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [fileName]);
  return (
    <div style={{ width: 64, height: 40, background: 'var(--motif-placeholder-bg)', overflow: 'hidden', border: `1px solid var(--motif-border-dark)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {url ? <img src={url} alt={fileName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--motif-placeholder-text)' }}>...</div>}
    </div>
  );
};

export default function AdminPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const mountedRef = useRef(false);

  // auth state: read localStorage set by MotifLayout to avoid duplicate session requests
  const [authChecked, setAuthChecked] = useState(false);

  // modal state (motif-styled like Contact)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [heroImage, setHeroImage] = useState<string>('');
  const [tags, setTags] = useState('');

  // search state
  const [searchText, setSearchText] = useState('');
  const [showTagSearch, setShowTagSearch] = useState(false);
  const [tagSearchText, setTagSearchText] = useState('');

  // pagination + blogs from redux
  const blogs = useSelector((state: any) => state.blog.blogs || []);
  const page = useSelector((state: any) => state.blog.page || 1);
  const per_page = useSelector((state: any) => state.blog.per_page || 4);
  const total = useSelector((state: any) => state.blog.total || 0);

  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  useEffect(() => {
    // avoid double fetch in StrictMode
    if (mountedRef.current) return;
    mountedRef.current = true;

    // only check localStorage flag set by MotifLayout; MotifLayout already performs the session fetch
    const authed = (() => {
      try { return localStorage.getItem('adminAuthenticated') === 'true'; } catch (e) { return false; }
    })();

    if (authed) {
      dispatch(fetchBlogs(1));
    } else {
      // redirect to home and trigger login modal via location state
      navigate('/', { replace: true, state: { adminLogin: true } });
    }
    setAuthChecked(true);
  }, [dispatch, navigate]);

  if (!authChecked) return null; // prevent flash

  // helper to insert markdown image placeholder at cursor position
  const insertImageMarkdown = (fileName: string) => {
    const md = `![${fileName}](${fileName})`;
    try {
      const el = contentRef.current as HTMLTextAreaElement | null;
      if (!el) {
        setContent((c) => (c ? c + '\n' + md : md));
        return;
      }
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const before = content.slice(0, start);
      const after = content.slice(end);
      const newContent = before + md + after;
      setContent(newContent);
      // place cursor after inserted text
      requestAnimationFrame(() => {
        try { el.focus(); el.selectionStart = el.selectionEnd = start + md.length; } catch (e) {}
      });
    } catch (e) { console.error(e); }
  };

  const openModal = (blog?: Blog | null) => {
    if (blog) {
      setEditingBlog(blog);
      setTitle(blog.title || '');
      setContent((typeof blog.content === 'string' ? blog.content : '') || '');
      setTags(Array.isArray(blog.tags) ? blog.tags.join(',') : (blog.tags as string) || '');
      setHeroImage(blog.hero_image || '');
    } else {
      setEditingBlog(null);
      setTitle('');
      setContent('');
      setTags('');
      setHeroImage('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const saveBlog = async () => {
    try {
      const method = editingBlog ? 'PUT' : 'POST';
      const url = editingBlog ? `/api/blogs/${editingBlog.id}` : '/api/blogs';
      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, content, tags, hero_image: heroImage })
      });
      if (resp.ok) {
        dispatch(fetchBlogs(1));
        closeModal();
      } else {
        console.error('Save failed', await resp.text());
      }
    } catch (e) { console.error(e); }
  };

  const deleteBlog = async (id: number) => {
    try {
      const resp = await fetch(`/api/blogs/${id}`, { method: 'DELETE', credentials: 'include' });
      if (resp.ok) dispatch(fetchBlogs(1));
      else console.error('Delete failed', await resp.text());
    } catch (e) { console.error(e); }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setTagSearchText(e.target.value);

  const doLogout = async () => {
    try {
      const resp = await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (resp.ok) {
        // Clear admin auth state
        try { localStorage.removeItem('adminAuthenticated'); } catch (e) {}
        // Navigate back to home
        navigate('/', { replace: true });
      } else {
        console.error('Logout failed');
      }
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const doSearch = () => {
    const q = (searchText || '').trim();
    const tag = (tagSearchText || '').trim();
    // reuse redux search action
    dispatch(searchBlogs(q, 1, tag));
  };

  const totalPages = Math.max(1, Math.ceil((total || 0) / per_page));

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', color: 'var(--motif-text)' }}>Manage Blogs</Typography>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
        <button className="motif-btn" onClick={() => openModal(null)}>Add Blog</button>
        <button className="motif-btn" onClick={doLogout}>Logout</button>
      </div>

      <div className="motif-search-controls" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input aria-label="Search admin by keyword or tag" placeholder="search tags or keywords" value={searchText} onChange={(e) => { const v = e.target.value.replace(/[\x00-\x1f\x7f]/g,''); if (v.length<=200) setSearchText(v); }} className="motif-input" style={{ flex: 1 }} />
        <button className="motif-btn" onClick={() => setShowTagSearch(s => !s)} aria-pressed={showTagSearch} style={{ minWidth: 64, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Tags</button>
        <button className="motif-btn" onClick={() => { const q = (searchText||'').trim(); if (q.length>200) return; doSearch(); }} style={{ whiteSpace: 'nowrap', minWidth: '88px', height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Search</button>
      </div>

      {showTagSearch && (
        <div style={{ marginBottom: 12 }}>
          <input aria-label="Search admin by tag" placeholder="search tag" value={tagSearchText} onChange={handleTagInputChange} className="motif-input" style={{ width: '100%' }} />
        </div>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        {Array.isArray(blogs) && blogs.length > 0 ? blogs.map((b: any) => {
          const tagsArr = Array.isArray(b.tags) ? b.tags : (typeof b.tags === 'string' ? b.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
          const hero = b.hero_image || b.image || '';
          return (
            <div key={b.id} className="motif-card" style={{ width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box', padding: 0, overflow: 'visible' }}>
              <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* image / hero area */}
                <div style={{ position: 'relative', width: '100%', height: 110, overflow: 'hidden' }}>
                  {hero ? (
                    <HeroImage src={hero} />
                  ) : (
                    <div style={{ height: '100%', background: 'var(--motif-placeholder-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--motif-placeholder-text)', fontWeight: 700 }}>No image</div>
                  )}

                  {/* edit / delete buttons overlay top-right */}
                  <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, zIndex: 1200 }}>
                    <div className="motif-btn" onClick={() => openModal(b)} style={{ padding: '4px 8px', cursor: 'pointer' }}>Edit</div>
                    <div className="motif-btn" onClick={() => deleteBlog(b.id)} style={{ padding: '4px 8px', cursor: 'pointer' }}>Delete</div>
                  </div>
                </div>

                {/* subcard/content */}
                <div style={{ padding: '8px', boxSizing: 'border-box', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div className="motif-subcard" style={{ background: 'var(--motif-subcard-bg)', padding: '12px', borderStyle: 'solid', borderWidth: 2, borderTopColor: 'var(--motif-border-dark)', borderLeftColor: 'var(--motif-border-dark)', borderRightColor: '#FFFFFF', borderBottomColor: '#FFFFFF', boxShadow: 'inset 1px 1px 0 rgba(0,0,0,0.25)', height: 100, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', color: 'var(--motif-text)' }}>
                    <div style={{ paddingBottom: 4, fontFamily: 'Consolas, monospace', fontWeight: 700 }}>
                      <Typography variant="h6" component="h3" sx={{ fontSize: '1rem', lineHeight: '1.1' }}>{b.title}</Typography>
                    </div>
                    <div style={{ marginTop: 6, fontFamily: 'Consolas, monospace' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--motif-text)' }} title={(b.content || '').replace(/\s+/g, ' ').trim()}>{(b.content || '').replace(/\s+/g, ' ').trim()}</Typography>
                    </div>
                  </div>

                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap', overflow: 'hidden', minWidth: 0 }}>
                      {tagsArr.slice(0, 5).map((t: string, idx: number) => {
                        const bg = (() => { let h = 0; for (let i = 0; i < t.length; i++) h = (h << 5) - h + t.charCodeAt(i); const hue = Math.abs(h) % 360; return `hsl(${hue}, 55%, 76%)`; })();
                        return (
                          <div key={`${t}-${idx}`} role="button" tabIndex={0} className="motif-tag" title={t} onClick={() => { setTagSearchText(t); setShowTagSearch(true); dispatch(searchBlogs(searchText || '', 1, t)); }} style={{ background: bg, color: '#000', height: 28, minWidth: 48, maxWidth: 140, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', boxSizing: 'border-box', overflow: 'hidden' }}>
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{t}</span>
                          </div>
                        );
                      })}
                    </div>
                    {tagsArr.length > 5 && (
                      <div style={{ display: 'inline-block' }}>
                        <TagOverflow tags={tagsArr.slice(5)} onTagClick={(t) => { setTagSearchText(t); setShowTagSearch(true); dispatch(searchBlogs(searchText || '', 1, t)); }} />
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        }) : (
          <div style={{ width: '100%', textAlign: 'center', color: 'gray', marginTop: 16 }}>No blogs found.</div>
        )}
      </Box>

      {/* pagination controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
        <button className="motif-btn" disabled={page <= 1} onClick={() => dispatch(fetchBlogs(page - 1))} style={{ opacity: page <= 1 ? 0.5 : 1 }}>Prev</button>
        <Typography sx={{ alignSelf: 'center', color: 'var(--motif-text)' }}>{page} / {totalPages}</Typography>
        <button className="motif-btn" disabled={page >= totalPages} onClick={() => dispatch(fetchBlogs(page + 1))} style={{ opacity: page >= totalPages ? 0.5 : 1 }}>Next</button>
      </div>

      {/* Motif-styled modal matching contact form UX */}
      {isModalOpen && (
        <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(92vw, 720px)', maxHeight: '90vh', overflow: 'auto', boxSizing: 'border-box', background: 'var(--motif-bg, #d0cfc8)', padding: 8, border: `2px solid var(--motif-border-dark)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--motif-titlebar-bg)', color: 'var(--motif-titlebar-text)', padding: '6px 8px' }}>
              <div style={{ color: 'var(--motif-titlebar-text)', fontWeight: 700 }}>{editingBlog ? 'Edit Blog' : 'Add Blog'}</div>
              <div className="motif-btn" onClick={closeModal} style={{ borderRadius: 8, padding: '6px 8px' }} aria-label="Close">✕</div>
            </div>
            <div style={{ padding: 8, color: 'var(--motif-text)' }}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 4, color: 'var(--motif-text)' }}>Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="motif-input" style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 4, color: 'var(--motif-text)' }}>Content (Markdown)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="motif-btn" onClick={() => setImagePickerOpen(true)}>Insert Image</div>
                    <div className="motif-btn" onClick={() => setImagePickerOpen(true)}>Insert / Set Hero</div>
                  </div>
                </div>
                <textarea ref={contentRef} value={content} onChange={(e) => setContent(e.target.value)} rows={12} style={{ width: '100%' }} className="motif-input" />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 4, color: 'var(--motif-text)' }}>Tags (comma separated)</label>
                <input value={tags} onChange={(e) => setTags(e.target.value)} className="motif-input" style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 4, color: 'var(--motif-text)' }}>Hero Image</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={heroImage} onChange={(e) => setHeroImage(e.target.value)} className="motif-input" style={{ flex: 1 }} placeholder="enter filename or select via image picker" />
                  <div className="motif-btn" onClick={() => setImagePickerOpen(true)}>Select</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                <div className="motif-btn" onClick={closeModal}>Cancel</div>
                <div className="motif-btn" onClick={saveBlog}>Save</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* S3 Image picker modal */}
      <S3ImagePicker open={imagePickerOpen} onClose={() => setImagePickerOpen(false)} onSelect={(f) => insertImageMarkdown(f)} onSetHero={(f) => { setHeroImage(f); setImagePickerOpen(false); }} />

      {/* Contacts table */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--motif-text)' }}>Received Contacts</div>
        <div style={{ background: 'var(--motif-subcard-bg)', border: '2px solid var(--motif-border-dark)', padding: 8 }}>
          <ContactsTable />
        </div>
      </div>

      {/* S3 upload section */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--motif-text)' }}>Upload Media to S3</div>
        <div style={{ background: 'var(--motif-subcard-bg)', border: '2px solid var(--motif-border-dark)', padding: 8 }}>
          <S3Uploader />
        </div>
      </div>

    </Box>
  );
}


// Contacts table + modal component (paginated, theme-friendly)
const ContactsTable: React.FC = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(4);
  const [total, setTotal] = useState(0);

  const fetchPage = async (p: number) => {
    setLoading(true);
    try {
      const resp = await fetch(`/api/admin/contacts?page=${p}&per_page=${perPage}`, { credentials: 'include' });
      if (!resp.ok) { setContacts([]); setTotal(0); setLoading(false); return; }
      const j = await resp.json();
      // support two response formats: legacy array or { contacts, total }
      if (Array.isArray(j)) {
        // server returned full array -> store full list and rely on client-side slicing
        setContacts(j);
        setTotal(j.length);
      } else if (j && Array.isArray(j.contacts)) {
        // server returned paginated subset
        setContacts(j.contacts);
        setTotal(typeof j.total === 'number' ? j.total : j.contacts.length);
      } else {
        setContacts([]);
        setTotal(0);
      }
    } catch (e) {
      console.error(e);
      setContacts([]);
      setTotal(0);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPage(page); }, [page]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / perPage));

  // determine displayed contacts: if server returned paginated subset (total > contacts.length)
  // then contacts already represents the current page; otherwise slice client-side
  const displayedContacts = (contacts.length > 0 && total > contacts.length)
    ? contacts
    : contacts.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      {loading && <div style={{ color: 'var(--motif-placeholder-text)' }}>Loading...</div>}
      {!loading && displayedContacts.length === 0 && <div style={{ color: 'var(--motif-placeholder-text)' }}>No contacts received.</div>}
      {!loading && displayedContacts.length > 0 && (
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <div style={{ display: 'grid', gap: 6, minWidth: 600 }}>
            {displayedContacts.map((c) => (
              <div key={c.id} className="motif-card" style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'var(--motif-subcard-bg)', color: 'var(--motif-text)', minWidth: 0 }} onClick={() => setSelected(c)}>
                <div style={{ fontFamily: 'Consolas, monospace', minWidth: 120, flexShrink: 0 }}>{c.name}</div>
                <div style={{ color: 'var(--motif-placeholder-text)', minWidth: 150, flexShrink: 0 }}>{c.email}</div>
                <div style={{ color: 'var(--motif-placeholder-text)', minWidth: 140, flexShrink: 0 }}>{new Date(c.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
        <button className="motif-btn" disabled={page <= 1} onClick={() => { const np = Math.max(1, page - 1); setPage(np); }} aria-disabled={page <= 1}>Prev</button>
        <div style={{ alignSelf: 'center', color: 'var(--motif-text)' }}>{page} / {totalPages}</div>
        <button className="motif-btn" disabled={page >= totalPages} onClick={() => { const np = Math.min(totalPages, page + 1); setPage(np); }} aria-disabled={page >= totalPages}>Next</button>
      </div>

      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 6000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(92vw, 640px)', background: 'var(--motif-bg)', padding: 12, border: '2px solid var(--motif-border-dark)', color: 'var(--motif-text)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--motif-titlebar-bg)', color: 'var(--motif-titlebar-text)', padding: '6px 8px' }}>
              <div style={{ fontWeight: 700 }}>Contact Details</div>
              <div className="motif-btn" onClick={() => setSelected(null)} aria-label="Close">✕</div>
            </div>
            <div style={{ padding: 8 }}>
              <div style={{ marginBottom: 8 }}><strong>Name:</strong> {selected.name}</div>
              <div style={{ marginBottom: 8 }}><strong>Email:</strong> {selected.email}</div>
              <div style={{ marginBottom: 8 }}><strong>Received:</strong> {new Date(selected.created_at).toLocaleString()}</div>
              <div style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}><strong>Message:</strong>
                <div style={{ marginTop: 6, padding: 8, background: 'var(--motif-card-bg, #fff)', color: 'var(--motif-text)' }}>{selected.message}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// S3 uploader component with simplified workflow
const S3Uploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [targetFolder, setTargetFolder] = useState<'blog_images' | 'music'>('blog_images');
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    setFile(f);
  };

  const doUpload = async () => {
    if (!file) { 
      setStatus('Select a file first'); 
      return; 
    }

    setUploading(true);
    setStatus('Getting upload URL...');

    try {
      // Step 1: Get presigned upload URL from server
      const urlResp = await fetch('/api/media/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          targetFolder: targetFolder
        })
      });

      if (!urlResp.ok) {
        const error = await urlResp.json();
        setStatus(`Failed to get upload URL: ${error.error || 'Unknown error'}`);
        setUploading(false);
        return;
      }

      const { uploadUrl, key, contentType } = await urlResp.json();
      
      // Step 2: Upload file directly to S3 using presigned URL
      setStatus('Uploading to S3...');
      
      const uploadPromise = new Promise<boolean>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.onload = () => {
          const success = xhr.status >= 200 && xhr.status < 300;
          if (!success) {
            console.error('S3 upload failed:', xhr.status, xhr.statusText, xhr.responseText);
            setStatus(`S3 upload failed: ${xhr.status} ${xhr.statusText}`);
          }
          resolve(success);
        };
        
        xhr.onerror = () => {
          console.error('S3 upload network error');
          setStatus('S3 upload network error - check CORS configuration');
          reject(new Error('Upload failed'));
        };
        
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', contentType);
        xhr.send(file);
      });

      const uploadSuccess = await uploadPromise;
      
      if (!uploadSuccess) {
        setUploading(false);
        return;
      }

      // Step 3: Confirm upload with server and register in database
      setStatus('Confirming upload...');
      
      const confirmResp = await fetch('/api/media/confirm-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          key: key,
          fileType: file.type
        })
      });

      if (confirmResp.ok) {
        const result = await confirmResp.json();
        if (result.success) {
          setStatus('Upload successful!');
          setFile(null);
        } else {
          setStatus('Upload succeeded but failed to register in database');
        }
      } else {
        setStatus('Upload succeeded but confirmation failed');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setStatus('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const doSync = async () => {
    setSyncing(true);
    setStatus('Syncing assets...');
    try {
      const resp = await fetch('/api/media/sync', { 
        method: 'POST', 
        credentials: 'include' 
      });
      
      if (!resp.ok) { 
        setStatus('Sync failed'); 
        setSyncing(false); 
        return; 
      }
      
      const result = await resp.json();
      if (result && result.success) {
        setStatus(`Sync complete. added=${result.added} updated=${result.updated} total=${result.total}`);
      } else {
        setStatus('Sync completed with errors');
      }
    } catch (e) { 
      console.error(e); 
      setStatus('Sync error'); 
    }
    setSyncing(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
        <select 
          value={targetFolder} 
          onChange={(e) => setTargetFolder(e.target.value as any)} 
          className="motif-input" 
          style={{ height: 32, background: 'var(--motif-input-bg)', color: 'var(--motif-text)' }}
        >
          <option value="blog_images">blog_images/</option>
          <option value="music">music/</option>
        </select>
        <input 
          type="file" 
          onChange={onFileChange} 
          disabled={uploading} 
        />
        <div 
          className="motif-btn" 
          onClick={doUpload} 
          style={{ 
            opacity: uploading || !file ? 0.6 : 1, 
            pointerEvents: uploading || !file ? 'none' : 'auto' 
          }} 
          aria-disabled={uploading || !file}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </div>
        <div 
          className="motif-btn" 
          onClick={doSync} 
          style={{ 
            opacity: syncing ? 0.6 : 1, 
            pointerEvents: syncing ? 'none' : 'auto' 
          }} 
          aria-disabled={syncing}
        >
          {syncing ? 'Syncing...' : 'Sync S3 Assets'}
        </div>
      </div>
      
      <div style={{ color: 'var(--motif-placeholder-text)', marginBottom: 8 }}>
        {status}
      </div>

    </div>
  );
};
