import React from 'react';
import ServersComponent from '../components/Servers/Servers';
import { Box } from '@mui/material';

const Servers: React.FC = () => {
  return (
    <Box p={3}>
      <ServersComponent />
    </Box>
  );
};

export default Servers; 