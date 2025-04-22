import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Edit as EditIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { getMCPServers, updateServerConfig } from '../../services/api';
import { MCPServer } from '../../types';

const Servers: React.FC = () => {
  const navigate = useNavigate();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const data = await getMCPServers();
      setServers(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch MCP servers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (server: MCPServer) => {
    setSelectedServer(server);
    setDetailsDialog(true);
  };

  const handleConfigure = (server: MCPServer) => {
    navigate('/settings', { state: { serverId: server.id } });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          MCP Servers
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={fetchServers}
          startIcon={<RefreshIcon />}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {servers.map((server) => (
          <Grid item xs={12} md={6} lg={4} key={server.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" component="div">
                    {server.name}
                  </Typography>
                  <Chip
                    label={server.status}
                    color={getStatusColor(server.status)}
                    size="small"
                  />
                </Box>
                <Typography color="text.secondary" gutterBottom>
                  {server.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  URL: {server.url}
                </Typography>
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    Capabilities:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                    {server.capabilities.map((capability) => (
                      <Chip
                        key={capability}
                        label={capability}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" mt={2}>
                  Last Seen: {new Date(server.lastSeen).toLocaleString()}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => handleViewDetails(server)}>
                  View Details
                </Button>
                <Button 
                  size="small" 
                  onClick={() => handleConfigure(server)}
                  startIcon={<EditIcon />}
                >
                  Configure
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Server Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth>
        {selectedServer && (
          <>
            <DialogTitle>{selectedServer.name} Details</DialogTitle>
            <DialogContent>
              <Box mt={2}>
                <Typography variant="subtitle1" gutterBottom>
                  Description
                </Typography>
                <Typography paragraph>
                  {selectedServer.description}
                </Typography>

                <Typography variant="subtitle1" gutterBottom>
                  Server Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      ID
                    </Typography>
                    <Typography variant="body1">
                      {selectedServer.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={selectedServer.status}
                      color={getStatusColor(selectedServer.status)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      URL
                    </Typography>
                    <Typography variant="body1">
                      {selectedServer.url}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Last Seen
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedServer.lastSeen).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>

                <Typography variant="subtitle1" gutterBottom mt={3}>
                  Capabilities
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {selectedServer.capabilities.map((capability) => (
                    <Chip
                      key={capability}
                      label={capability}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialog(false)}>Close</Button>
              <Button 
                onClick={() => {
                  setDetailsDialog(false);
                  handleConfigure(selectedServer);
                }}
                startIcon={<EditIcon />}
              >
                Configure
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Servers; 