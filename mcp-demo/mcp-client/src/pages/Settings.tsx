import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { getMCPServerById, updateServerConfig, getServerConfig } from '../services/api';
import { MCPServer } from '../types';

const Settings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const serverId = location.state?.serverId;
  const [server, setServer] = useState<MCPServer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<{ [key: string]: string }>({});
  const [refreshDialogOpen, setRefreshDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchServerAndConfig = async () => {
      if (!serverId) {
        setError('No server ID provided');
        setLoading(false);
        return;
      }

      try {
        const [serverData, configData] = await Promise.all([
          getMCPServerById(serverId),
          getServerConfig(serverId)
        ]);
        
        setServer(serverData);
        setConfig(configData || {});
      } catch (err) {
        setError('Failed to fetch server configuration');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchServerAndConfig();
  }, [serverId]);

  const handleConfigChange = (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({
      ...prev,
      [key]: event.target.value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!serverId) return;

    try {
      setLoading(true);
      await updateServerConfig(serverId, config);
      setSuccess(true);
      setError(null);
      setRefreshDialogOpen(true);
    } catch (err) {
      setError('Failed to update server configuration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshConfirm = async () => {
    try {
      setRefreshing(true);
      // Wait a moment to allow the server to reload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Don't fetch the updated configuration since we want to keep the current changes
      setSuccess(true);
      setError(null);
    } catch (err) {
      setError('Failed to refresh configuration');
      console.error(err);
    } finally {
      setRefreshing(false);
      setRefreshDialogOpen(false);
    }
  };

  const renderM365Config = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Tenant ID"
          value={config.M365_TENANT_ID || ''}
          onChange={handleConfigChange('M365_TENANT_ID')}
          required
          helperText="Current value from .env file"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Client ID"
          value={config.M365_CLIENT_ID || ''}
          onChange={handleConfigChange('M365_CLIENT_ID')}
          required
          helperText="Current value from .env file"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Client Secret"
          type="password"
          value={config.M365_CLIENT_SECRET || ''}
          onChange={handleConfigChange('M365_CLIENT_SECRET')}
          required
          helperText="Current value from .env file"
        />
      </Grid>
    </Grid>
  );

  const renderServiceNowConfig = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Instance URL"
          value={config.SNOW_INSTANCE || ''}
          onChange={handleConfigChange('SNOW_INSTANCE')}
          required
          helperText="Current value from .env file"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Username"
          value={config.SNOW_USERNAME || ''}
          onChange={handleConfigChange('SNOW_USERNAME')}
          required
          helperText="Current value from .env file"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Password"
          type="password"
          value={config.SNOW_PASSWORD || ''}
          onChange={handleConfigChange('SNOW_PASSWORD')}
          required
          helperText="Current value from .env file"
        />
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!server) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {error || 'Server not found'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Configure {server.name}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mt: 2 }}>
        <form onSubmit={handleSubmit}>
          {server.id === 'm365' ? renderM365Config() : renderServiceNowConfig()}
          
          <Box mt={3}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
            >
              Save Configuration
            </Button>
          </Box>
        </form>
      </Paper>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        message="Configuration updated successfully"
      />

      <Dialog
        open={refreshDialogOpen}
        onClose={() => setRefreshDialogOpen(false)}
      >
        <DialogTitle>Configuration Updated</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The server configuration has been updated and the server is reloading. 
            Would you like to refresh to see the updated configuration?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefreshDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleRefreshConfirm} 
            color="primary" 
            disabled={refreshing}
            startIcon={refreshing ? <CircularProgress size={20} /> : null}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings; 