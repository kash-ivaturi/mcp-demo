// MCP Server types
export interface MCPServer {
  id: string;
  name: string;
  description: string;
  url: string;
  status: 'online' | 'offline';
  capabilities: string[];
  lastSeen: string;
}

// Incident types
export interface Incident {
  id: string;
  source: string;
  title: string;
  description: string;
  status: 'new' | 'pending' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  targetUser?: {
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
  type: 'request' | 'response' | 'notification';
  source: string;
  target: string;
  payload: any;
  status: 'success' | 'error' | 'pending';
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