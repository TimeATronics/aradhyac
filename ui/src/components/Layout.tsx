// @ts-ignore
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemButton, ListItemText, Box } from '@mui/material';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/') setSelectedIndex(0);
    else if (location.pathname === '/message') setSelectedIndex(1);
    else if (location.pathname === '/image') setSelectedIndex(2);
  }, [location.pathname]);

  const handleListItemClick = (index: number, path: string) => {
    setSelectedIndex(index);
    navigate(path);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
          },
        }}
      >
        <List>
          <ListItem>
            <ListItemButton
              selected={selectedIndex === 0}
              onClick={() => handleListItemClick(0, '/')}
            >
              <ListItemText primary="Home" />
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton
              selected={selectedIndex === 1}
              onClick={() => handleListItemClick(1, '/message')}
            >
              <ListItemText primary="Message" />
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton
              selected={selectedIndex === 2}
              onClick={() => handleListItemClick(2, '/image')}
            >
              <ListItemText primary="Image" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}

export default Layout;
