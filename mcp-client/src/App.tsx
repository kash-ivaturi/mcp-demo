import React from 'react';
import { CssBaseline, Typography, Container } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          MCP Client
        </Typography>
      </Container>
    </ThemeProvider>
  );
};

export default App; 