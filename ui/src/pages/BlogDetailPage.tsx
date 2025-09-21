// @ts-ignore
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Box, Paper } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import HeroImage from '../components/HeroImage';

interface Blog {
  id: number;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  author: string;
  hero_image?: string;
}

function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchBlog(parseInt(id));
    }
  }, [id]);

  const fetchBlog = async (blogId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/blogs/${blogId}`);
      const data = await response.json();
      setBlog(data);
    } catch (error) {
      console.error('Error fetching blog:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Typography sx={{ color: 'var(--motif-text)' }}>Loading...</Typography>;
  if (!blog) return <Typography sx={{ color: 'var(--motif-text)' }}>Blog not found</Typography>;

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, color: 'var(--motif-text)' }}>
      <Box className="motif-card" sx={{ p: { xs: 1, sm: 2 }, backgroundColor: 'var(--motif-subcard-bg)' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ flex: { xs: 1, md: 2 } }}>
            {/* Title + optional hero banner */}
            {blog.hero_image ? (
              <div style={{ width: '100%', height: 240, overflow: 'hidden', marginBottom: 12, position: 'relative', borderRadius: 2 }}>
                <HeroImage src={blog.hero_image} height={240} />
                <div style={{ position: 'absolute', left: 12, top: 12, maxWidth: '80%', background: 'var(--motif-subcard-bg)', padding: 8, border: '2px solid var(--motif-border-dark)', boxSizing: 'border-box' }}>
                  <Typography variant="h5" sx={{ color: 'var(--motif-text)', margin: 0 }}>{blog.title}</Typography>
                </div>
              </div>
            ) : (
              <Typography variant="h4" gutterBottom sx={{ color: 'var(--motif-text)' }}>{blog.title}</Typography>
            )}

            {/* mobile-only author + tags (shows below hero/title on small screens) */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'var(--motif-text)' }}>
                By {blog.author} on {new Date(blog.created_at).toLocaleDateString()}
              </Typography>
              <Box sx={{ mt: 1 }}>
                {Array.isArray(blog.tags) && blog.tags.map((tag) => {
                  const bg = ((): string => { let h = 0; for (let i = 0; i < tag.length; i++) h = (h << 5) - h + tag.charCodeAt(i); const hue = Math.abs(h) % 360; return `hsl(${hue}, 55%, 76%)`; })();
                  const match = bg.match(/hsl\([^,]+,[^,]+,\s*([0-9]+)%\)/);
                  const lightness = match ? parseInt(match[1], 10) : 76;
                  const textColor = lightness > 70 ? '#000' : 'var(--motif-text)';
                  return (
                    <div key={tag} className="motif-tag" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', height: 28, marginRight: 6, background: bg, color: textColor, maxWidth: 140, overflow: 'hidden' }} title={tag}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{tag}</span>
                    </div>
                  );
                })}
              </Box>
            </Box>

            <ReactMarkdown components={{
              img: ({ node, ...props }: any) => {
                const src = props.src || '';
                // treat local filenames that end with common image extensions as S3 assets
                const hasImageExt = /\.(png|jpe?g|gif|webp|svg|bmp|avif|ico)(\?.*)?$/i.test(src);
                const isS3 = !/^(https?:)?\/\//i.test(src) && hasImageExt;
                const [url, setUrl] = useState(isS3 ? '' : src);
                useEffect(() => {
                  let mounted = true;
                  if (isS3) {
                    fetch(`/api/media/download-url/${encodeURIComponent(src)}`).then(r => r.json()).then(j => {
                      if (!mounted) return;
                      if (j && j.url) setUrl(j.url);
                    }).catch(() => {});
                  }
                  return () => { mounted = false; };
                }, [src]);
                return (
                  <span style={{ display: 'block', width: '100%', overflow: 'hidden', margin: '12px 0' }}>
                    {url ? (
                      <img src={url} alt={props.alt || ''} style={{ width: '100%', height: 'auto', maxWidth: '100%', display: 'block' }} />
                    ) : (
                      <span style={{ width: '100%', minHeight: 140, background: 'var(--motif-placeholder-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--motif-placeholder-text)' }}>Loading image...</span>
                    )}
                  </span>
                );
              }
            }}>
               {blog.content || ''}
             </ReactMarkdown>
          </Box>
          <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }}>
            <Paper sx={{ p: 2, backgroundColor: 'var(--motif-paper-bg)', border: '2px inset var(--motif-border-light)' }}>
              <Typography variant="body2" sx={{ color: 'var(--motif-text)' }}>
                By {blog.author} on {new Date(blog.created_at).toLocaleDateString()}
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Array.isArray(blog.tags) && blog.tags.map((tag) => {
                  const bg = ((): string => { let h = 0; for (let i = 0; i < tag.length; i++) h = (h << 5) - h + tag.charCodeAt(i); const hue = Math.abs(h) % 360; return `hsl(${hue}, 55%, 76%)`; })();
                  // compute color contrast: if bg is lightish, force black text
                  // approximate lightness from hsl(, , L%) by parsing L
                  const match = bg.match(/hsl\([^,]+,[^,]+,\s*([0-9]+)%\)/);
                  const lightness = match ? parseInt(match[1], 10) : 76;
                  const textColor = lightness > 70 ? '#000' : 'var(--motif-text)';
                  return (
                    <div key={tag} className="motif-tag" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', height: 28, marginRight: 6, background: bg, color: textColor, maxWidth: 140, overflow: 'hidden' }} title={tag}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{tag}</span>
                    </div>
                  );
                })}
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default BlogDetailPage;
