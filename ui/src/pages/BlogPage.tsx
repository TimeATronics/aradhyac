// @ts-ignore
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Typography, Box, Card, CardActionArea, CardContent } from '@mui/material';

import { fetchBlogs, searchBlogs } from '../store/actions/blogActions';
import HeroImage from '../components/HeroImage';
import './responsive-overrides.css';

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
                 style={{ background: ((): string => { let h = 0; for (let i = 0; i < t.length; i++) h = (h << 5) - h + t.charCodeAt(i); const hue = Math.abs(h) % 360; return `hsl(${hue}, 55%, 76%)`; })(), color: 'var(--motif-text)' }}
               >{t}</div>
             </div>
           ))}
         </div>
       </div>
     </div>
   );
};

// memoized list to avoid re-rendering the heavy list when only the search input changes
const BlogList: React.FC<{ blogs: any[]; onTagClick: (tag: string) => void; navigate: (p: string) => void }> = React.memo(function BlogList({ blogs, onTagClick, navigate }) {
  return (
    <>
      {Array.isArray(blogs) && blogs.map((b: any) => {
        const tags = Array.isArray(b.tags)
          ? b.tags
          : (typeof b.tags === 'string' ? b.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
        const hero = b.hero_image || b.image || '';

        return (
          <Card
            key={b.id}
            className="motif-card"
            sx={{
              width: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
              height: 260,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'none',
              bgcolor: 'transparent',
              padding: 0,
              // allow dropdowns to overflow the card bounds so they render above the card
              overflow: 'visible'
            }}
            style={{ background: 'var(--motif-card-bg)', color: 'var(--motif-text)' }}
          >
            <CardActionArea
              onClick={() => navigate(`/blog/${b.id}`)}
              sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' }}
            >
              {hero ? (
                <HeroImage src={hero} />
               ) : (
                <Box
                  sx={{
                    height: 110,
                    background: 'var(--motif-placeholder-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--motif-placeholder-text)',
                    fontWeight: 700,
                    width: '100%'
                  }}
                >
                  No image
                </Box>
              )}

              <CardContent sx={{ p: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 150, boxSizing: 'border-box' }}>
                {/* inner sub-card: lighter surface, inset look (dark top-left borders, light bottom-right) */}
                <div style={{ padding: '0 4px', boxSizing: 'border-box' }}>
                  <div
                    className="motif-subcard"
                    style={{
                      background: 'var(--motif-subcard-bg)', /* lighter text surface */
                      padding: '12px 12px 16px 12px',
                      borderStyle: 'solid',
                      borderWidth: 2,
                      /* inset: dark top/left, light bottom/right */
                      borderTopColor: 'var(--motif-border-dark)',
                      borderLeftColor: 'var(--motif-border-dark)',
                      borderRightColor: '#FFFFFF',
                      borderBottomColor: '#FFFFFF',
                      boxShadow: 'inset 1px 1px 0 rgba(0,0,0,0.25)',
                      height: 100,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div className="card-title" style={{ paddingBottom: 4, fontFamily: 'Consolas, monospace', fontWeight: 700, color: 'var(--motif-text)' }}>
                      <Typography variant="h6" component="h3" sx={{ fontSize: '1rem', lineHeight: '1.1', color: 'var(--motif-text)' }}>{b.title}</Typography>
                    </div>
                    <div className="card-excerpt" style={{ paddingBottom: 4, fontFamily: 'Consolas, monospace', marginTop: 6 }}>
                      {/* single-line ellipsis truncation */}
                      <Typography
                        variant="body2"
                        title={(b.content || '').replace(/\s+/g, ' ').trim()}
                        sx={{
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: 'var(--motif-text)'
                        }}
                      >
                        {(b.content || '').replace(/\s+/g, ' ').trim()}
                      </Typography>
                    </div>
                  </div>
                </div>

                {/* tags row: fixed height, no scrolling. If more than 5 tags show overflow dropdown. */}
                <Box sx={{ mt: 1, display: 'flex', gap: 0.5, alignItems: 'center', px: 1, pb: 0.5, height: 40, boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap', overflow: 'hidden', minWidth: 0 }}>
                    {tags.slice(0, 5).map((t: string, idx: number) => {
                      const bg = ((): string => {
                        let h = 0; for (let i = 0; i < t.length; i++) h = (h << 5) - h + t.charCodeAt(i);
                        const hue = Math.abs(h) % 360; return `hsl(${hue}, 55%, 76%)`;
                      })();
                      // use a focusable div instead of a <button> to avoid nesting buttons inside CardActionArea
                      return (
                        <div
                          key={`${t}-${idx}`}
                          role="button"
                          tabIndex={0}
                          className="motif-tag"
                          title={t}
                          onClick={(e) => { e.stopPropagation(); onTagClick(t); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onTagClick(t); } }}
                          aria-label={`search-tag-${t}`}
                          style={{ background: bg, color: '#000', height: 28, minWidth: 48, maxWidth: 140, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', boxSizing: 'border-box', overflow: 'hidden' }}
                        >
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{t}</span>
                        </div>
                      );
                    })}
                  </div>

                  {tags.length > 5 && (
                    <TagOverflow tags={tags.slice(5)} onTagClick={onTagClick} />
                  )}
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        )
      })}
    </>
  )
});

function BlogPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return; // avoid double-fetch in StrictMode during dev
    mountedRef.current = true;
    dispatch(fetchBlogs(1));
  }, [dispatch]);

  const blogs = useSelector((state: any) => state.blog.blogs);
  const total = useSelector((state: any) => state.blog.total);
  const page = useSelector((state: any) => state.blog.page);
  const per_page = useSelector((state: any) => state.blog.per_page);
  const searchQuery = useSelector((state: any) => state.blog.searchQuery);

  const [searchText, setSearchText] = useState(searchQuery || '');
  const [showTagSearch, setShowTagSearch] = useState(false);
  const [tagSearchText, setTagSearchText] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Trigger search when user presses Enter
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch();
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagSearchText(e.target.value);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch();
    }
  };

  // If global searchQuery is cleared (via toolbar Clear action), ensure local input clears too
  React.useEffect(() => {
    if (!searchQuery) setSearchText('');
  }, [searchQuery]);

  const doSearch = () => {
    const q = (searchText || '').trim();
    const tag = (tagSearchText || '').trim();
    dispatch(searchBlogs(q, 1, tag));
  };

  const goToPage = (p: number) => {
    if (searchQuery) dispatch(searchBlogs(searchQuery, p));
    else dispatch(fetchBlogs(p));
  };

  const totalPages = Math.ceil((total || 0) / per_page);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', color: 'var(--motif-text)' }}>Latest Blogs</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
        <div className="motif-search-controls" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            aria-label="Search by keyword or tag"
            placeholder="search tags or keywords"
            value={searchText}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            className="motif-input"
            style={{ flex: 1 }}
          />
          <button
            className="motif-btn"
            onClick={() => setShowTagSearch(s => !s)}
            aria-pressed={showTagSearch}
            title="Toggle tag search"
            style={{ minWidth: 64, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >Tags</button>
          <button className="motif-btn" onClick={() => { const q = (searchText||'').trim(); if (q.length>100) { return; } doSearch(); }} style={{ whiteSpace: 'nowrap', minWidth: '88px', height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>Search</button>
        </div>

        {showTagSearch && (
          <div>
            <input
              aria-label="Search by tag"
              placeholder="search tag"
              value={tagSearchText}
              onChange={handleTagInputChange}
              onKeyDown={handleTagInputKeyDown}
              className="motif-input"
              style={{ width: '100%' }}
            />
          </div>
        )}
      </Box>
      <Box
        sx={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        <BlogList
          blogs={blogs}
          navigate={navigate}
          onTagClick={(t: string) => { setTagSearchText(t); setShowTagSearch(true); dispatch(searchBlogs(searchText || '', 1, t)); }}
        />
      </Box>

      {/* pagination controls */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
        <button className="motif-btn" disabled={page <= 1} onClick={() => goToPage(page - 1)} style={{ opacity: page <= 1 ? 0.5 : 1 }}>Prev</button>
        <Typography sx={{ alignSelf: 'center', color: 'var(--motif-text)' }}>{page} / {totalPages || 1}</Typography>
        <button className="motif-btn" disabled={page >= totalPages} onClick={() => goToPage(page + 1)} style={{ opacity: page >= totalPages ? 0.5 : 1 }}>Next</button>
      </Box>
    </Box>
  );
}

export default BlogPage;
