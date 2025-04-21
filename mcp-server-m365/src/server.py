from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from loguru import logger
import os
from dotenv import load_dotenv
import msal
from azure.identity import ClientSecretCredential
from azure.graphrbac import GraphRbacManagementClient
from typing import Optional
import json
import datetime

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

class M365API:
    def __init__(self):
        self.tenant_id = TENANT_ID
        self.client_id = CLIENT_ID
        self.client_secret = CLIENT_SECRET
        self.authority = AUTHORITY
        self.scope = SCOPE
        self._credential = None
        self._graph_client = None

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

m365_api = M365API()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat()
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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3000))
    uvicorn.run(app, host="0.0.0.0", port=port) 