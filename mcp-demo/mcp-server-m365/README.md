# MCP Server for Microsoft 365 Family

A Management Control Protocol (MCP) server that provides password reset capabilities for Microsoft 365 Family members. Built with FastAPI and Azure Graph API.

## Features

- Reset passwords for M365 Family members
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
- Microsoft 365 Family subscription
- Azure AD application with appropriate permissions:
  - User.ReadWrite.All
  - Directory.ReadWrite.All

## Azure AD Setup

1. Register a new application in Azure AD:
   - Go to Azure Portal > Azure Active Directory > App registrations
   - Create a new registration
   - Set the redirect URI (if needed)
   - Note down the Application (client) ID and Directory (tenant) ID

2. Create a client secret:
   - Go to Certificates & secrets
   - Create a new client secret
   - Note down the secret value

3. Grant API permissions:
   - Go to API permissions
   - Add Microsoft Graph permissions
   - Grant admin consent for the required permissions

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
5. Update the `.env` file with your Azure AD credentials and configuration

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

### Password Reset
- POST `/api/mcp/family/password/reset`
  - Reset a family member's password
  - Body:
    ```json
    {
      "user_email": "family.member@example.com",
      "new_password": "NewSecurePassword123!",
      "force_change": true
    }
    ```

## Security Considerations

- All sensitive information is stored in environment variables
- CORS is enabled for API access
- Azure AD credentials are required for operation
- Passwords should meet Microsoft's complexity requirements
- Consider implementing additional authentication for the MCP server itself
- Use HTTPS in production
- Implement rate limiting for password reset attempts

## Logging

Logs are stored in:
- `error.log`: Error-level logs
- `combined.log`: All logs
- Console output

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 