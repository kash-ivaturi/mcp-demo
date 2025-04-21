# MCP Demo

This repository contains a collection of MCP (Multi-Cloud Platform) demo projects:

- **mcp-client**: React TypeScript client application for interacting with MCP servers
- **mcp-server-m365**: MCP server implementation for Microsoft 365 integration
- **mcp-server-snow**: MCP server implementation for ServiceNow integration

## Getting Started

Each project has its own README with specific setup instructions.

### MCP Client

The MCP client is a React TypeScript application built with Material-UI. To run it:

```bash
cd mcp-client
npm install
npm start
```

### MCP Servers

The MCP servers are Node.js applications that provide integration with various cloud services. To run them:

```bash
cd mcp-server-m365  # or mcp-server-snow
npm install
npm start
```

## Architecture

The MCP demo consists of:

1. A central client application that provides a unified interface
2. Multiple server implementations that connect to different cloud services

Each component is designed to be modular and can be extended with additional functionality. 