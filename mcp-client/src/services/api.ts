import axios from 'axios';
import { MCPServer, Incident, Activity } from '../types';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// MCP Server API
export const getMCPServers = async (): Promise<MCPServer[]> => {
  try {
    const response = await api.get('/api/servers');
    return response.data;
  } catch (error) {
    console.error('Error fetching MCP servers:', error);
    throw error;
  }
};

export const getMCPServerById = async (id: string): Promise<MCPServer> => {
  try {
    const response = await api.get(`/api/servers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching MCP server ${id}:`, error);
    throw error;
  }
};

// Incident API
export const getIncidents = async (): Promise<Incident[]> => {
  try {
    const response = await api.get('/api/incidents');
    return response.data;
  } catch (error) {
    console.error('Error fetching incidents:', error);
    throw error;
  }
};

export const getIncidentById = async (id: string): Promise<Incident> => {
  try {
    const response = await api.get(`/api/incidents/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching incident ${id}:`, error);
    throw error;
  }
};

export const updateIncidentStatus = async (
  id: string,
  status: 'pending' | 'resolved' | 'rejected',
  action?: { type: string; payload: any }
): Promise<Incident> => {
  try {
    const response = await api.patch(`/api/incidents/${id}`, {
      status,
      action,
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating incident ${id}:`, error);
    throw error;
  }
};

// Activity API
export const getActivities = async (): Promise<Activity[]> => {
  try {
    const response = await api.get('/api/activities');
    return response.data;
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error;
  }
};

// MCP Server-specific API calls
export const resetM365Password = async (
  serverId: string,
  userEmail: string,
  newPassword: string
): Promise<any> => {
  try {
    const response = await api.post(`/api/servers/${serverId}/m365/password/reset`, {
      user_email: userEmail,
      new_password: newPassword,
      force_change: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error resetting M365 password:', error);
    throw error;
  }
};

export const createServiceNowIncident = async (
  serverId: string,
  incidentData: {
    title: string;
    description: string;
    priority: string;
    category: string;
  }
): Promise<any> => {
  try {
    const response = await api.post(`/api/servers/${serverId}/servicenow/incident`, incidentData);
    return response.data;
  } catch (error) {
    console.error('Error creating ServiceNow incident:', error);
    throw error;
  }
}; 