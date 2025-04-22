from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from loguru import logger
import os
from dotenv import load_dotenv
import msal
from azure.identity import ClientSecretCredential
from azure.graphrbac import GraphRbacManagementClient
from typing import Optional, Dict
import json
import datetime
import sys
import requests
import threading
import time
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

# Configure logger
logger.add("error.log", rotation="500 MB", level="ERROR")
logger.add("combined.log", rotation="500 MB", level="INFO")

app = FastAPI(title="MCP Server for M365 Family")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# M365 configuration
TENANT_ID = os.getenv("M365_TENANT_ID")
CLIENT_ID = os.getenv("M365_CLIENT_ID")
CLIENT_SECRET = os.getenv("M365_CLIENT_SECRET")
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
SCOPE = ["https://graph.microsoft.com/.default"]

class PasswordResetRequest(BaseModel):
    user_email: EmailStr
    new_password: str
    force_change: bool = True

class ConfigUpdate(BaseModel):
    config: Dict[str, str]

class M365API:
    def __init__(self):
        self.tenant_id = TENANT_ID
        self.client_id = CLIENT_ID
        self.client_secret = CLIENT_SECRET
        self.authority = AUTHORITY
        self.scope = SCOPE
        self._credential = None
        self._graph_client = None
        self.base_url = "https://graph.microsoft.com/v1.0"

    def _get_credential(self):
        if not self._credential:
            self._credential = ClientSecretCredential(
                tenant_id=self.tenant_id,
                client_id=self.client_id,
                client_secret=self.client_secret
            )
        return self._credential

    def _get_graph_client(self):
        if not self._graph_client:
            credential = self._get_credential()
            self._graph_client = GraphRbacManagementClient(
                credential=credential,
                tenant_id=self.tenant_id
            )
        return self._graph_client

    async def reset_family_member_password(self, reset_request: PasswordResetRequest):
        try:
            graph_client = self._get_graph_client()
            
            # Get user by email
            users = list(graph_client.users.list(
                filter=f"mail eq '{reset_request.user_email}'"
            ))
            
            if not users:
                raise HTTPException(
                    status_code=404,
                    detail=f"User with email {reset_request.user_email} not found"
                )
            
            user = users[0]
            
            # Reset password
            password_profile = {
                "password": reset_request.new_password,
                "forceChangePasswordNextSignIn": reset_request.force_change
            }
            
            graph_client.users.update(
                user.object_id,
                {"passwordProfile": password_profile}
            )
            
            logger.info(f"Password reset successful for user: {reset_request.user_email}")
            return {"success": True, "message": "Password reset successful"}
            
        except Exception as e:
            logger.error(f"Error resetting password: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def update_config(self, config: Dict[str, str]):
        """Update the .env file with new configuration"""
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        
        # Read existing .env file
        env_vars = {}
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                for line in f:
                    if line.strip() and not line.startswith('#'):
                        key, value = line.strip().split('=', 1)
                        env_vars[key] = value

        # Update with new config
        env_vars.update(config)

        # Write back to .env file
        with open(env_path, 'w') as f:
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")

        # Update instance variables
        self.tenant_id = config.get('M365_TENANT_ID', self.tenant_id)
        self.client_id = config.get('M365_CLIENT_ID', self.client_id)
        self.client_secret = config.get('M365_CLIENT_SECRET', self.client_secret)

    def get_access_token(self):
        """Get Microsoft Graph API access token"""
        if not all([self.tenant_id, self.client_id, self.client_secret]):
            raise HTTPException(status_code=500, detail="M365 configuration is missing")

        token_url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
        token_data = {
            'grant_type': 'client_credentials',
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'scope': 'https://graph.microsoft.com/.default'
        }

        response = requests.post(token_url, data=token_data)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        return response.json()['access_token']

m365_api = M365API()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "config": {
            "tenant_id": m365_api.tenant_id,
            "client_id": m365_api.client_id,
            "configured": bool(m365_api.tenant_id and m365_api.client_id and m365_api.client_secret)
        }
    }

@app.post("/api/mcp/family/password/reset")
async def reset_password(reset_request: PasswordResetRequest):
    try:
        result = await m365_api.reset_family_member_password(reset_request)
        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in password reset endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mcp/config")
async def get_config():
    """Get the current M365 configuration"""
    return {
        "success": True,
        "config": {
            "M365_TENANT_ID": TENANT_ID,
            "M365_CLIENT_ID": CLIENT_ID,
            "M365_CLIENT_SECRET": CLIENT_SECRET
        }
    }

@app.put("/api/mcp/config")
async def update_config(config_update: ConfigUpdate):
    try:
        m365_api.update_config(config_update.config)
        logger.info("Configuration updated successfully")
        return {"success": True, "message": "Configuration updated successfully"}
    except Exception as e:
        logger.error(f"Error updating configuration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mcp/reload")
async def reload_server():
    try:
        # Reload environment variables
        load_dotenv(override=True)
        
        # Update global variables
        global TENANT_ID, CLIENT_ID, CLIENT_SECRET, AUTHORITY
        TENANT_ID = os.getenv("M365_TENANT_ID")
        CLIENT_ID = os.getenv("M365_CLIENT_ID")
        CLIENT_SECRET = os.getenv("M365_CLIENT_SECRET")
        AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
        
        # Update M365 API instance with new config
        m365_api.tenant_id = TENANT_ID
        m365_api.client_id = CLIENT_ID
        m365_api.client_secret = CLIENT_SECRET
        m365_api.authority = AUTHORITY
        
        logger.info("Server reloaded successfully with new configuration")
        return {"success": True, "message": "Server reloaded successfully"}
    except Exception as e:
        logger.error(f"Error reloading server: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mcp/family/activities")
async def get_activities():
    """Get all activities from M365 server.
    Note: To fetch real activities, the following Microsoft Graph API permissions are required:
    - User.Read.All (for user activities)
    - AuditLog.Read.All (for audit logs)
    """
    try:
        # Return sample activities for now
        activities = [
            {
                "id": "m365-1",
                "timestamp": datetime.now().isoformat(),
                "type": "auth",
                "source": "m365",
                "target": "client",
                "payload": {
                    "action": "user_signin",
                    "user": "john.doe@example.com",
                    "display_name": "John Doe"
                },
                "status": "success"
            },
            {
                "id": "m365-2",
                "timestamp": (datetime.now() - timedelta(hours=1)).isoformat(),
                "type": "user",
                "source": "m365",
                "target": "client",
                "payload": {
                    "action": "password_reset",
                    "user": "jane.smith@example.com",
                    "display_name": "Jane Smith"
                },
                "status": "success"
            },
            {
                "id": "m365-3",
                "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
                "type": "user",
                "source": "m365",
                "target": "client",
                "payload": {
                    "action": "user_created",
                    "user": "bob.wilson@example.com",
                    "display_name": "Bob Wilson"
                },
                "status": "success"
            }
        ]
        
        # Sort activities by timestamp in descending order
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        return activities
    except Exception as e:
        logger.error(f"Error getting activities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001) 