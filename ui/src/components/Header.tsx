// @ts-ignore
import { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Avatar, Box, useTheme, useMediaQuery } from '@mui/material';
import { Menu as MenuIcon, Brightness4, Brightness7 } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

function Header({ darkMode, toggleDarkMode }: HeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleLogin = () => {
    // TODO: Implement admin login
    handleClose();
  };

  const navItems = [
    { label: 'Blog', path: '/' },
    { label: 'Projects', path: '/projects' },
    { label: 'About', path: '/about' },
  ];

  return (
    <AppBar position="static" sx={{ backgroundColor: '#c0c0c0', color: 'black', border: '2px inset #c0c0c0' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontFamily: 'Consolas', fontWeight: 'bold' }}>
          aradhyac
        </Typography>
        {!isMobile && (
          <Box sx={{ display: 'flex' }}>
            {navItems.map((item) => (
              <Button key={item.label} color="inherit" onClick={() => navigate(item.path)}>
                {item.label}
              </Button>
            ))}
          </Box>
        )}
        <IconButton color="inherit" onClick={toggleDarkMode}>
          {darkMode ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
        <IconButton onClick={handleAvatarClick}>
          <Avatar sx={{ bgcolor: 'gray' }}>A</Avatar>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={handleLogin}>Admin Login</MenuItem>
        </Menu>
        {isMobile && (
          <>
            <IconButton color="inherit" onClick={handleMobileMenuClick}>
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchor}
              open={Boolean(mobileMenuAnchor)}
              onClose={handleMobileMenuClose}
            >
              {navItems.map((item) => (
                <MenuItem key={item.label} onClick={() => { navigate(item.path); handleMobileMenuClose(); }}>
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Header;
