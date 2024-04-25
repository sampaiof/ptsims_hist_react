import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Home as HomeIcon,
  SportsMotorsports as SportsMotorsportsIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import Link from 'next/link';

const NavBar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' ||
        (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleDrawer(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Racing App
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <List>
          <ListItem button onClick={toggleDrawer(false)}>
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>
          <Divider />
          <ListItem button>
            <Link href="/competition">
              <ListItemText primary="Competitions" />
            </Link>
          </ListItem>
          <Divider />
          <ListItem button>
            <PersonIcon />
            <Link href="/driver">
              <ListItemText primary="Drivers" />
            </Link>
          </ListItem>
          <Divider />
          <ListItem button>
            <SportsMotorsportsIcon />
            <Link href="/team">
              <ListItemText primary="Teams" />
            </Link>
          </ListItem>
        </List>
      </Drawer>
    </>
  );
};

export default NavBar;
