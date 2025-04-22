import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navigation: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          MCP Client
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">
            Dashboard
          </Button>
          <Button color="inherit" component={RouterLink} to="/servers">
            Servers
          </Button>
          <Button color="inherit" component={RouterLink} to="/activity">
            Activity
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation; 