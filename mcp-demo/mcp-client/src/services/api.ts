import axios from 'axios';
import { MCPServer, Incident, Activity } from '../types';
import * as mockApi from './mockApi';

// Flag to use mock data instead of real API
const USE_MOCK_DATA = false;

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const M365_SERVER_URL = process.env.REACT_APP_M365_SERVER_URL || 'http://localhost:3001';
const SNOW_SERVER_URL = process.env.REACT_APP_SNOW_SERVER_URL || 'http://localhost:3002';

// Create axios instances
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const m365Api = axios.create({
  baseURL: M365_SERVER_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const snowApi = axios.create({
  baseURL: SNOW_SERVER_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// MCP Server API
export const getMCPServers = async (): Promise<MCPServer[]> => {
  if (USE_MOCK_DATA) {
    return mockApi.getMockServers();
  }
  
  try {
    // Fetch health status from both servers
    const [m365Health, snowHealth] = await Promise.all([
      m365Api.get('/health'),
      snowApi.get('/health')
    ]);

    // Construct server objects from health responses
    const servers: MCPServer[] = [
      {
        id: 'm365',
        name: 'Microsoft 365 Server',
        description: 'Handles Microsoft 365 integration and user management',
        url: M365_SERVER_URL,
        status: m365Health.data.status === 'healthy' ? 'online' : 'offline',
        capabilities: ['user_management', 'incident_management', 'activity_tracking'],
        lastSeen: new Date().toISOString(),
        config: m365Health.data.config || {}
      },
      {
        id: 'snow',
        name: 'ServiceNow Server',
        description: 'Manages ServiceNow integration and incident tracking',
        url: SNOW_SERVER_URL,
        status: snowHealth.data.status === 'healthy' ? 'online' : 'offline',
        capabilities: ['incident_management', 'activity_tracking'],
        lastSeen: new Date().toISOString(),
        config: snowHealth.data.config || {}
      }
    ];

    return servers;
  } catch (error) {
    console.error('Error fetching MCP servers:', error);
    throw error;
  }
};

export const getMCPServerById = async (id: string): Promise<MCPServer> => {
  if (USE_MOCK_DATA) {
    return mockApi.getMockServerById(id);
  }
  
  try {
    const servers = await getMCPServers();
    const server = servers.find(s => s.id === id);
    if (!server) {
      throw new Error(`Server with ID ${id} not found`);
    }
    return server;
  } catch (error) {
    console.error(`Error fetching MCP server ${id}:`, error);
    throw error;
  }
};

export const getServerConfig = async (serverId: string): Promise<{ [key: string]: string }> => {
  if (USE_MOCK_DATA) {
    return mockApi.getMockConfig(serverId);
  }
  
  try {
    // Determine which server to get config from based on the server ID
    const api = serverId === 'm365' ? m365Api : snowApi;
    const response = await api.get('/api/mcp/config');
    return response.data.config;
  } catch (error) {
    console.error(`Error fetching server ${serverId} configuration:`, error);
    throw error;
  }
};

export const updateServerConfig = async (serverId: string, config: { [key: string]: string }): Promise<MCPServer> => {
  if (USE_MOCK_DATA) {
    return mockApi.updateMockServerConfig(serverId, config);
  }
  
  try {
    // Determine which server to update based on the server ID
    const api = serverId === 'm365' ? m365Api : snowApi;
    const response = await api.put('/api/mcp/config', { config });
    
    // Trigger server reload after config update
    await reloadServer(serverId);
    
    // Refresh the client data
    await refreshClientData();
    
    return response.data;
  } catch (error) {
    console.error(`Error updating server ${serverId} configuration:`, error);
    throw error;
  }
};

export const reloadServer = async (serverId: string): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log(`Mock reload for server ${serverId}`);
    return;
  }
  
  try {
    // Determine which server to reload based on the server ID
    const api = serverId === 'm365' ? m365Api : snowApi;
    await api.post('/api/mcp/reload');
    console.log(`${serverId} server reloaded successfully`);
  } catch (error) {
    console.error(`Error reloading server ${serverId}:`, error);
    throw error;
  }
};

// New function to refresh client data
export const refreshClientData = async (): Promise<void> => {
  if (USE_MOCK_DATA) {
    console.log('Mock client data refresh');
    return;
  }
  
  try {
    // Refresh all relevant data
    await Promise.all([
      getMCPServers(),
      getIncidents(),
      getActivities()
    ]);
    
    console.log('Client data refreshed successfully');
  } catch (error) {
    console.error('Error refreshing client data:', error);
    throw error;
  }
};

// Incident API
export const getIncidents = async (): Promise<Incident[]> => {
  try {
    // For now, return a combination of incidents from both servers
    let m365Incidents: any[] = [];
    let snowIncidents: any[] = [];
    
    try {
      const m365Response = await m365Api.get('/api/mcp/family/incidents');
      m365Incidents = m365Response.data || [];
    } catch (error) {
      console.error('Error fetching M365 incidents:', error);
    }
    
    try {
      const snowResponse = await snowApi.get('/api/mcp/incident');
      snowIncidents = snowResponse.data || [];
    } catch (error) {
      console.error('Error fetching ServiceNow incidents:', error);
    }
    
    // Combine and format incidents
    const incidents: Incident[] = [
      ...m365Incidents.map((incident: any) => ({
        id: `m365-${incident.id}`,
        source: 'm365',
        title: incident.title || 'M365 Password Reset Request',
        description: incident.description || 'User requested password reset',
        status: incident.status || 'new',
        priority: incident.priority || 'medium',
        createdAt: incident.created_at || new Date().toISOString(),
        updatedAt: incident.updated_at || new Date().toISOString(),
        targetUser: incident.target_user,
      })),
      ...snowIncidents.map((incident: any) => ({
        id: `snow-${incident.id}`,
        source: 'servicenow',
        title: incident.title || 'ServiceNow Incident',
        description: incident.description || 'ServiceNow incident created',
        status: incident.status || 'new',
        priority: incident.priority || 'medium',
        createdAt: incident.created_at || new Date().toISOString(),
        updatedAt: incident.updated_at || new Date().toISOString(),
      })),
    ];
    
    return incidents;
  } catch (error) {
    console.error('Error fetching incidents:', error);
    throw error;
  }
};

export const getIncidentById = async (id: string): Promise<Incident> => {
  try {
    const incidents = await getIncidents();
    const incident = incidents.find(i => i.id === id);
    if (!incident) {
      throw new Error(`Incident with ID ${id} not found`);
    }
    return incident;
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
    // Determine which server to update based on the incident ID
    const [source, incidentId] = id.split('-');
    
    if (source === 'm365') {
      const response = await m365Api.patch(`/api/mcp/family/incidents/${incidentId}`, {
        status,
        action,
      });
      return {
        id,
        source: 'm365',
        title: response.data.title || 'M365 Password Reset Request',
        description: response.data.description || 'User requested password reset',
        status: response.data.status || status,
        priority: response.data.priority || 'medium',
        createdAt: response.data.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        targetUser: response.data.target_user,
      };
    } else if (source === 'snow') {
      const response = await snowApi.patch(`/api/mcp/incident/${incidentId}`, {
        status,
        action,
      });
      return {
        id,
        source: 'servicenow',
        title: response.data.title || 'ServiceNow Incident',
        description: response.data.description || 'ServiceNow incident created',
        status: response.data.status || status,
        priority: response.data.priority || 'medium',
        createdAt: response.data.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      throw new Error(`Unknown incident source: ${source}`);
    }
  } catch (error) {
    console.error(`Error updating incident ${id}:`, error);
    throw error;
  }
};

// Activity API
export const getActivities = async (): Promise<Activity[]> => {
  try {
    // For now, return a combination of activities from both servers
    let m365Activities: any[] = [];
    let snowActivities: any[] = [];
    
    try {
      const m365Response = await m365Api.get('/api/mcp/family/activities');
      m365Activities = m365Response.data || [];
    } catch (error) {
      console.error('Error fetching M365 activities:', error);
    }
    
    try {
      const snowResponse = await snowApi.get('/api/mcp/activities');
      snowActivities = snowResponse.data || [];
    } catch (error) {
      console.error('Error fetching ServiceNow activities:', error);
    }
    
    // Combine and format activities
    const activities: Activity[] = [
      ...m365Activities.map((activity: any) => ({
        id: `m365-${activity.id}`,
        timestamp: activity.timestamp || new Date().toISOString(),
        type: activity.type || 'request',
        source: 'm365',
        target: activity.target || 'client',
        payload: activity.payload || {},
        status: activity.status || 'success',
        error: activity.error,
      })),
      ...snowActivities.map((activity: any) => ({
        id: `snow-${activity.id}`,
        timestamp: activity.timestamp || new Date().toISOString(),
        type: activity.type || 'request',
        source: 'servicenow',
        target: activity.target || 'client',
        payload: activity.payload || {},
        status: activity.status || 'success',
        error: activity.error,
      })),
    ];
    
    return activities;
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
    const response = await m365Api.post('/api/mcp/family/password/reset', {
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
    const response = await snowApi.post('/api/mcp/incident', incidentData);
    return response.data;
  } catch (error) {
    console.error('Error creating ServiceNow incident:', error);
    throw error;
  }
}; 