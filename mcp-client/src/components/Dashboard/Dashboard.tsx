import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { getIncidents, updateIncidentStatus, resetM365Password } from '../../services/api';
import { Incident } from '../../types';

const Dashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const data = await getIncidents();
      setIncidents(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch incidents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleIncidentAction = async (incident: Incident, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve' && incident.source === 'servicenow' && incident.targetUser) {
        setSelectedIncident(incident);
        setResetPasswordDialog(true);
      } else {
        await updateIncidentStatus(
          incident.id,
          action === 'approve' ? 'resolved' : 'rejected'
        );
        fetchIncidents();
      }
    } catch (err) {
      setError(`Failed to ${action} incident`);
      console.error(err);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedIncident || !selectedIncident.targetUser) return;

    try {
      setResetPasswordLoading(true);
      setResetPasswordError(null);

      // Find the M365 MCP server
      const m365Server = incidents.find(i => i.source === 'm365')?.source;
      if (!m365Server) {
        throw new Error('M365 MCP server not found');
      }

      // Reset the password
      await resetM365Password(
        m365Server,
        selectedIncident.targetUser.email,
        newPassword
      );

      // Update the incident status
      await updateIncidentStatus(selectedIncident.id, 'resolved', {
        type: 'password_reset',
        payload: { email: selectedIncident.targetUser.email }
      });

      setResetPasswordDialog(false);
      setNewPassword('');
      fetchIncidents();
    } catch (err) {
      setResetPasswordError('Failed to reset password');
      console.error(err);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
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
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {incidents.map((incident) => (
          <Grid item xs={12} md={6} key={incident.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" component="div">
                    {incident.title}
                  </Typography>
                  <Chip
                    label={incident.priority}
                    color={getPriorityColor(incident.priority)}
                    size="small"
                  />
                </Box>
                <Typography color="text.secondary" gutterBottom>
                  {incident.description}
                </Typography>
                {incident.targetUser && (
                  <Typography variant="body2" color="text.secondary">
                    Target User: {incident.targetUser.email}
                  </Typography>
                )}
                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() => handleIncidentAction(incident, 'approve')}
                    disabled={incident.status !== 'new'}
                    sx={{ mr: 1 }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => handleIncidentAction(incident, 'reject')}
                    disabled={incident.status !== 'new'}
                  >
                    Reject
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Password Reset Dialog */}
      <Dialog open={resetPasswordDialog} onClose={() => setResetPasswordDialog(false)}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {resetPasswordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {resetPasswordError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="New Password"
            type="password"
            fullWidth
            variant="outlined"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialog(false)}>Cancel</Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            color="primary"
            disabled={!newPassword || resetPasswordLoading}
          >
            {resetPasswordLoading ? <CircularProgress size={24} /> : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 