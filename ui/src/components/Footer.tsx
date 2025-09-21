// @ts-ignore
import { useState } from 'react';
import { Box, Typography, TextField, Button, Grid, Link } from '@mui/material';
import { GitHub, LinkedIn } from '@mui/icons-material';
import SOCIAL_LINKS from '../pages/constants/socialLinks';

function Footer() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (response.ok) {
        alert('Message sent!');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        alert('Failed to send message.');
      }
    } catch (error) {
      alert('Error sending message.');
    }
  };

  return (
    <Box sx={{ backgroundColor: '#c0c0c0', p: 3, mt: 5, borderTop: '2px inset #c0c0c0' }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Typography variant="h6">Contact Me</Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            <TextField
              label="Message"
              multiline
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            <Button type="submit" variant="contained" sx={{ mt: 2 }}>
              Send
            </Button>
          </form>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="h6">Social Media</Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Link href={SOCIAL_LINKS.github} target="_blank" rel="noreferrer">
              <GitHub />
            </Link>
            <Link href={SOCIAL_LINKS.linkedin} target="_blank" rel="noreferrer">
              <LinkedIn />
            </Link>
            <Link href={SOCIAL_LINKS.scholar} target="_blank" rel="noreferrer" title="Google Scholar" sx={{ display: 'flex', alignItems: 'center' }}>
              {/* using plain text for scholar since there's no icon */}
              <Typography variant="body2" sx={{ ml: 0.5 }}>Scholar</Typography>
            </Link>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="body2">
            © 2025 Aradhya Chakrabarti. All rights reserved.
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Footer;
