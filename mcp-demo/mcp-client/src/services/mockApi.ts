import { MCPServer, Incident, Activity } from '../types';

// Mock data for servers
const mockServers: MCPServer[] = [
  {
    id: 'm365',
    name: 'Microsoft 365 Server',
    description: 'Handles Microsoft 365 integration and user management',
    url: 'http://localhost:3001',
    status: 'active',
    capabilities: ['user_management', 'incident_management', 'activity_tracking'],
    lastSeen: new Date().toISOString(),
    config: {
      clientId: 'mock-client-id',
      clientSecret: 'mock-client-secret',
      tenantId: 'mock-tenant-id',
    },
  },
  {
    id: 'snow',
    name: 'ServiceNow Server',
    description: 'Manages ServiceNow integration and incident tracking',
    url: 'http://localhost:3002',
    status: 'active',
    capabilities: ['incident_management', 'activity_tracking'],
    lastSeen: new Date().toISOString(),
    config: {
      instanceUrl: 'https://mock-instance.service-now.com',
      username: 'mock-username',
      password: 'mock-password',
    },
  },
];

// Mock data for incidents
const mockIncidents: Incident[] = [
  {
    id: 'INC001',
    source: 'm365',
    title: 'User Account Locked',
    description: 'User account has been locked due to multiple failed login attempts',
    status: 'open',
    priority: 'high',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    targetUser: {
      id: 'user1',
      email: 'user1@example.com',
      name: 'John Doe',
    },
  },
  {
    id: 'INC002',
    source: 'snow',
    title: 'Service Degradation',
    description: 'Service is experiencing slow response times',
    status: 'in_progress',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    targetUser: {
      id: 'user2',
      email: 'user2@example.com',
      name: 'Jane Smith',
    },
  },
];

// Mock data for activities
const mockActivities: Activity[] = [
  {
    id: 'ACT001',
    timestamp: new Date().toISOString(),
    type: 'incident_created',
    source: 'm365',
    target: 'snow',
    payload: {
      incidentId: 'INC001',
      userId: 'user1',
    },
    status: 'completed',
  },
  {
    id: 'ACT002',
    timestamp: new Date().toISOString(),
    type: 'incident_updated',
    source: 'snow',
    target: 'm365',
    payload: {
      incidentId: 'INC002',
      status: 'in_progress',
    },
    status: 'completed',
  },
  {
    id: 'ACT003',
    timestamp: new Date().toISOString(),
    type: 'config_updated',
    source: 'm365',
    target: 'm365',
    payload: {
      serverId: 'm365',
      config: {
        clientId: 'new-client-id',
      },
    },
    status: 'completed',
  },
];

// Mock API functions
export const getMockServers = async (): Promise<MCPServer[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockServers;
};

export const getMockServerById = async (id: string): Promise<MCPServer> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const server = mockServers.find(s => s.id === id);
  if (!server) {
    throw new Error(`Server with ID ${id} not found`);
  }
  return server;
};

export const updateMockServerConfig = async (
  serverId: string,
  config: { [key: string]: string }
): Promise<MCPServer> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const serverIndex = mockServers.findIndex(s => s.id === serverId);
  if (serverIndex === -1) {
    throw new Error(`Server with ID ${serverId} not found`);
  }
  
  mockServers[serverIndex] = {
    ...mockServers[serverIndex],
    config: {
      ...mockServers[serverIndex].config,
      ...config,
    },
  };
  
  return mockServers[serverIndex];
};

export const getMockIncidents = async (): Promise<Incident[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockIncidents;
};

export const getMockIncidentById = async (id: string): Promise<Incident> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const incident = mockIncidents.find(i => i.id === id);
  if (!incident) {
    throw new Error(`Incident with ID ${id} not found`);
  }
  return incident;
};

export const getMockActivities = async (): Promise<Activity[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockActivities;
};

export const getMockConfig = (serverId: string): { [key: string]: string } => {
  if (serverId === 'm365') {
    return {
      M365_TENANT_ID: 'mock-tenant-id',
      M365_CLIENT_ID: 'mock-client-id',
      M365_CLIENT_SECRET: '********'
    };
  } else {
    return {
      SNOW_INSTANCE: 'mock-instance.service-now.com',
      SNOW_USERNAME: 'mock-username',
      SNOW_PASSWORD: '********'
    };
  }
}; 