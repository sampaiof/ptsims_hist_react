// components/NavBar.tsx
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import Link from 'next/link';

const NavBar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          Racing App
        </Typography>
        <Button color="inherit">
          <Link href="/competition">Competitions</Link>
        </Button>
        <Button color="inherit">
          <Link href="/driver">Drivers</Link>
        </Button>
        <Button color="inherit">
          <Link href="/team">Teams</Link>
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
