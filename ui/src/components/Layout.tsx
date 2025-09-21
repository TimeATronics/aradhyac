// @ts-ignore
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Box, Paper, TextField, Link, Snackbar, Alert, ThemeProvider, createTheme, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Menu as MenuIcon, Brightness4, Brightness7, AccountCircle } from '@mui/icons-material';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      background: {
        default: darkMode ? '#2e2e2e' : '#d4d0c8',
        paper: darkMode ? '#3e3e3e' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#000000',
        secondary: darkMode ? '#cccccc' : '#666666',
      },
    },
  });

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAdminLogin = () => {
    setLoginOpen(true);
    handleClose();
  };

  const handleLoginClose = () => {
    setLoginOpen(false);
  };

  const handleLoginSubmit = () => {
    // Simple check for demo
    if (username === 'admin' && password === 'password') {
      navigate('/admin');
      setLoginOpen(false);
    } else {
      alert('Invalid credentials');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleContactSubmit = async () => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });
      if (response.ok) {
        setSnackbarMessage('Message sent successfully!');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setSnackbarMessage('Failed to send message.');
      }
    } catch (error) {
      setSnackbarMessage('Error sending message.');
    }
    setSnackbarOpen(true);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', backgroundColor: 'background.default', color: 'text.primary' }}>
        <AppBar position="static" sx={{ backgroundColor: '#c0c0c0', color: '#000000', border: '2px inset #c0c0c0', width: '100%' }}>
          <Toolbar sx={{ minHeight: '32px !important' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontFamily: 'Consolas, monospace', fontWeight: 'bold', fontSize: '18px' }}>
              <Link href="/" color="inherit" underline="none">aradhyac</Link>
            </Typography>
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
              <Button color="inherit" sx={{ fontFamily: 'Consolas, monospace', fontSize: '14px' }} onClick={() => navigate('/')}>Blog</Button>
              <Button color="inherit" sx={{ fontFamily: 'Consolas, monospace', fontSize: '14px' }} onClick={() => navigate('/about')}>About</Button>
              <Button color="inherit" sx={{ fontFamily: 'Consolas, monospace', fontSize: '14px' }} onClick={() => navigate('/projects')}>Projects</Button>
            </Box>
            <IconButton color="inherit" onClick={toggleDarkMode} sx={{ fontSize: '16px' }}>
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
            <IconButton color="inherit" onClick={handleMenu} sx={{ fontSize: '16px' }}>
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleAdminLogin}>Admin Login</MenuItem>
            </Menu>
            <IconButton
              color="inherit"
              sx={{ display: { xs: 'block', md: 'none' } }}
              onClick={handleMenu}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, py: 3, width: '100%', backgroundColor: 'background.default' }}>
          <Paper sx={{ p: 2, mx: 0, backgroundColor: 'background.paper', border: '2px outset #c0c0c0', width: '100%', position: 'relative' }}>
            <Box sx={{ borderBottom: '1px solid #808080', pb: 1, mb: 2 }}>
              <Typography variant="h6" sx={{ fontFamily: 'Consolas, monospace', fontSize: '14px' }}>aradhyac - Portfolio</Typography>
            </Box>
            {children}
          </Paper>
        </Box>
        <Paper component="footer" sx={{ py: 1, px: 2, mt: 'auto', backgroundColor: '#c0c0c0', border: '2px inset #c0c0c0', width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontFamily: 'Consolas, monospace', fontSize: '12px' }}>Contact Me</Typography>
              <TextField label="Name" size="small" fullWidth margin="dense" sx={{ backgroundColor: '#ffffff', fontSize: '12px' }} value={name} onChange={(e) => setName(e.target.value)} />
              <TextField label="Email" size="small" fullWidth margin="dense" sx={{ backgroundColor: '#ffffff', fontSize: '12px' }} value={email} onChange={(e) => setEmail(e.target.value)} />
              <TextField label="Message" size="small" fullWidth multiline rows={2} margin="dense" sx={{ backgroundColor: '#ffffff', fontSize: '12px' }} value={message} onChange={(e) => setMessage(e.target.value)} />
              <Button variant="contained" size="small" sx={{ mt: 1, backgroundColor: '#c0c0c0', color: '#000000', fontSize: '12px' }} onClick={handleContactSubmit}>Send</Button>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontFamily: 'Consolas, monospace', fontSize: '12px' }}>Social Media</Typography>
              <Link href="#" color="inherit" sx={{ fontFamily: 'Consolas, monospace', fontSize: '12px' }}>LinkedIn</Link><br />
              <Link href="#" color="inherit" sx={{ fontFamily: 'Consolas, monospace', fontSize: '12px' }}>GitHub</Link><br />
              <Link href="#" color="inherit" sx={{ fontFamily: 'Consolas, monospace', fontSize: '12px' }}>Instagram</Link>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Consolas, monospace', fontSize: '12px' }}>
                © 2025 Aradhya Chakrabarti. All rights reserved.
              </Typography>
            </Box>
          </Box>
        </Paper>
        <Dialog open={loginOpen} onClose={handleLoginClose}>
          <DialogTitle>Admin Login</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Username"
              fullWidth
              variant="standard"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              variant="standard"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleLoginClose}>Cancel</Button>
            <Button onClick={handleLoginSubmit}>Login</Button>
          </DialogActions>
        </Dialog>
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
          <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default Layout;
