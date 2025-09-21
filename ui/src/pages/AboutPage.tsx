// @ts-ignore
import React, { useState, useEffect } from 'react';
import { Typography, Box } from '@mui/material';
import { useTheme } from 'styled-components';
import MusicPlayer from '../components/MusicPlayer';
import {
  HOBBIES,
  INTERESTS,
  CARD_COLORS
} from './constants/aboutConstants';
import './AboutPage.css';

const HERO_IMAGE = '/aradhyac_about_hero_image.jpg';
const PROFILE_IMAGE = '/aradhyac_about_profile.jpg';

function AboutPage() {
  const theme = useTheme() as any;
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 720 : false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 720);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  // detect dark vs light from a known theme property
  const isDark = theme && theme.imageFilter && theme.imageFilter !== 'none';
  const cardBg = (idx: number) => {
    const palette = isDark ? CARD_COLORS.dark : CARD_COLORS.light;
    return `linear-gradient(135deg, ${palette[idx % palette.length][0]}, ${palette[idx % palette.length][1]})`;
  };
  
  // motif subcard style reused from BlogPage for consistent look
  const motifSubcardStyle: React.CSSProperties = {
    background: (theme && theme.subcardBg) || 'var(--motif-subcard-bg)',
    padding: 12,
    borderStyle: 'solid',
    borderWidth: 2,
    borderTopColor: (theme && theme.borderDark) || 'var(--motif-border-dark)',
    borderLeftColor: (theme && theme.borderDark) || 'var(--motif-border-dark)',
    borderRightColor: '#FFFFFF',
    borderBottomColor: '#FFFFFF',
    boxShadow: 'inset 1px 1px 0 rgba(0,0,0,0.25)',
    height: 80,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    boxSizing: 'border-box'
  };

  return (
    <Box sx={{ p: 3 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Banner Hero Image (thinner) */}
        <div className="about-hero" style={{ width: '100%', overflow: 'hidden' }}>
          <img src={HERO_IMAGE} alt="hero" />
        </div>

        {/* Title and profile - profile moves below title on mobile */}
        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ flex: '1 1 60%', minWidth: 200 }}>
              <Typography variant="h4" gutterBottom sx={{ color: 'var(--motif-text)' }}>Hi there! I am Aradhya.</Typography>
              <Typography variant="body1" paragraph sx={{ color: 'var(--motif-text)' }}>
                I am an undergraduate Computer Science student who enjoys building software and exploring how things run on different kinds of systems, from desktops to low-powered devices. I spend a lot of my free time tinkering with open-source projects, FPGAs &amp; Arduinos, fixing bugs, and making them work in new places. I'm comfortable working with languages like Python, Java, C, Javascript, and tools across the Unix/Linux ecosystem. More than anything, I like learning by building and experimenting; it keeps the journey exciting.
              </Typography>
            </div>
            <div className="about-profile" style={{ flex: '0 0 auto', marginLeft: isMobile ? 0 : 'auto', marginTop: isMobile ? 12 : 0 }}>
              <div className="motif-card" style={{ padding: 8, display: 'inline-block', boxSizing: 'border-box' }} tabIndex={0} role="img" aria-label="profile photo of Aradhya">
                {/* Preserve aspect ratio and do not crop: use max-width and height auto */}
                <img src={PROFILE_IMAGE} alt="profile" />
              </div>
            </div>
          </div>
        </div>

        {/* Cards stacked responsive; two per row on wide screens, one per row on small */}
        <div className="cards-grid" style={{ gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)' }}>
          <div className="motif-card focusable" tabIndex={0} role="region" aria-label="Hobbies" style={{ background: cardBg(2), maxHeight: 180, overflow: 'hidden' }}>
             <div style={{ padding: 8 }}>
               <Typography variant="h6" sx={{ color: 'var(--motif-text)' }}>🎶 Hobbies</Typography>
             </div>
             <div style={{ padding: 8 }}>
               <div style={motifSubcardStyle}>
                 <Typography variant="body2" sx={{ color: 'var(--motif-text)', fontFamily: 'Consolas, monospace' }}>{HOBBIES}</Typography>
               </div>
             </div>
           </div>

          <div className="motif-card focusable" tabIndex={0} role="region" aria-label="Interests" style={{ background: cardBg(3), maxHeight: 180, overflow: 'hidden' }}>
             <div style={{ padding: 8 }}>
               <Typography variant="h6" sx={{ color: 'var(--motif-text)' }}>💡 Interests</Typography>
             </div>
             <div style={{ padding: 8 }}>
               <div style={motifSubcardStyle}>
                 <Typography variant="body2" sx={{ color: 'var(--motif-text)', fontFamily: 'Consolas, monospace' }}>{INTERESTS}</Typography>
               </div>
             </div>
           </div>
         </div>

        {/* Music section */}
        <div style={{ height: 24 }} />
        <Typography variant="h5" sx={{ color: 'var(--motif-text)', mb: 1 }}>My Music</Typography>
        <div style={{ marginBottom: 32 }}>
          <MusicPlayer compact />
        </div>
      </div>
    </Box>
  );
}

export default AboutPage;
