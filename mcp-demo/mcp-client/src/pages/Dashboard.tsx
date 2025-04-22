import React from 'react';
import { Typography, Container, Box, Grid, Paper, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Server Status
              </Typography>
              <Typography variant="body1" paragraph>
                You have 2 active servers running.
              </Typography>
              <Button 
                component={Link} 
                to="/servers" 
                variant="contained" 
                color="primary"
              >
                View Servers
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="body1" paragraph>
                No recent activity to display.
              </Typography>
              <Button 
                component={Link} 
                to="/activity" 
                variant="contained" 
                color="secondary"
              >
                View Activity
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" color="primary">
                  Add New Server
                </Button>
                <Button variant="outlined" color="primary">
                  Generate Report
                </Button>
                <Button variant="outlined" color="primary">
                  Configure Settings
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard; 