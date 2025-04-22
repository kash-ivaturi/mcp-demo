// MCP Server types
export interface MCPServer {
  id: string;
  name: string;
  description: string;
  url: string;
  status: 'online' | 'offline' | 'active';
  capabilities: string[];
  lastSeen: string;
  config?: {
    [key: string]: string;
  };
}

// Incident types
export interface Incident {
  id: string;
  source: string;
  title: string;
  description: string;
  status: 'new' | 'pending' | 'resolved' | 'rejected' | 'open' | 'in_progress';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  targetUser?: {
    id: string;
    email: string;
    name: string;
  };
  action?: {
    type: string;
    status: 'pending' | 'completed' | 'failed';
    result?: any;
  };
}

// Activity types
export interface Activity {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'notification' | 'incident_created' | 'incident_updated' | 'config_updated';
  source: string;
  target: string;
  payload: any;
  status: 'success' | 'error' | 'pending' | 'completed';
  error?: string;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
} 