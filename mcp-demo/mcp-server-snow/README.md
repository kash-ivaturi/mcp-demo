# MCP Server for ServiceNow (Python)

A Management Control Protocol (MCP) server that integrates with ServiceNow to manage incidents and other ServiceNow objects. Built with FastAPI.

## Features

- Create and manage ServiceNow incidents
- Health check endpoint
- Logging with Loguru
- Environment-based configuration
- CORS enabled
- Error handling and logging
- Automatic API documentation (Swagger UI)
- Type validation with Pydantic

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- ServiceNow instance with appropriate permissions
- ServiceNow credentials

## Setup

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
5. Update the `.env` file with your ServiceNow credentials and configuration

## Running the Server

Development mode:
```bash
uvicorn src.server:app --reload --port 3000
```

Production mode:
```bash
python src/server.py
```

## API Documentation

Once the server is running, you can access:
- Swagger UI: http://localhost:3000/docs
- ReDoc: http://localhost:3000/redoc

## API Endpoints

### Health Check
- GET `/health`
  - Returns server health status

### Incidents
- POST `/api/mcp/incident`
  - Create a new incident
  - Body:
    ```json
    {
      "title": "Incident Title",
      "description": "Incident Description",
      "priority": "1",
      "category": "hardware"
    }
    ```

- GET `/api/mcp/incident/{id}`
  - Get incident details by ID

## Logging

Logs are stored in:
- `error.log`: Error-level logs
- `combined.log`: All logs
- Console output

## Security

- All sensitive information should be stored in environment variables
- CORS is enabled for API access
- ServiceNow credentials are required for operation
- Input validation using Pydantic models

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 