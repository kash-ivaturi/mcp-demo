# MCP (Multi-Cloud Platform) Demo

This project demonstrates a multi-cloud platform that integrates with Microsoft 365 and ServiceNow. It consists of three main components:

1. **mcp-client**: A React-based web application that provides a unified interface for managing cloud services.
2. **mcp-server-m365**: A FastAPI server that handles Microsoft 365 integration.
3. **mcp-server-snow**: A FastAPI server that handles ServiceNow integration.

## Project Structure

```
mcp-demo/
├── mcp-client/         # React web application
├── mcp-server-m365/    # Microsoft 365 integration server
├── mcp-server-snow/    # ServiceNow integration server
└── start-servers.sh    # Script to start all servers
```

## Prerequisites

- Python 3.11 or higher
- Node.js 16 or higher
- Microsoft 365 account with appropriate permissions
- ServiceNow instance with admin access

## Setup

1. Set up Microsoft 365 server:
   ```bash
   cd mcp-server-m365
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Set up ServiceNow server:
   ```bash
   cd mcp-server-snow
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. Set up React client:
   ```bash
   cd mcp-client
   npm install
   ```

4. Configure environment variables:
   - Copy `.env.example` to `.env` in each server directory
   - Update the values with your credentials

## Running the Application

Use the provided script to start all servers:

```bash
./start-servers.sh
```

Or start each component individually:

1. Start Microsoft 365 server:
   ```bash
   cd mcp-server-m365
   source venv/bin/activate
   uvicorn src.server:app --host 0.0.0.0 --port 3001
   ```

2. Start ServiceNow server:
   ```bash
   cd mcp-server-snow
   source venv/bin/activate
   uvicorn src.server:app --host 0.0.0.0 --port 3002
   ```

3. Start React client:
   ```bash
   cd mcp-client
   npm start
   ```

## Features

- User management through Microsoft 365
- Incident management through ServiceNow
- Activity tracking across both platforms
- Configuration management for both services
- Health monitoring and status checks 