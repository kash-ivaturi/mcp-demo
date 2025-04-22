from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from loguru import logger
import os
from dotenv import load_dotenv
import requests
from typing import Optional, Dict
import json
import datetime
import sys
import threading
import time
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

# Configure logger
logger.add("error.log", rotation="500 MB", level="ERROR")
logger.add("combined.log", rotation="500 MB", level="INFO")

app = FastAPI(title="MCP Server for ServiceNow")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ServiceNow configuration
SNOW_INSTANCE = os.getenv("SNOW_INSTANCE")
SNOW_USERNAME = os.getenv("SNOW_USERNAME")
SNOW_PASSWORD = os.getenv("SNOW_PASSWORD")

class IncidentCreate(BaseModel):
    title: str
    description: str
    priority: str
    category: str

class ConfigUpdate(BaseModel):
    config: Dict[str, str]

class ServiceNowAPI:
    def __init__(self):
        self.instance = SNOW_INSTANCE
        self.auth = (SNOW_USERNAME, SNOW_PASSWORD)
        self.base_url = f"https://{self.instance}/api/now" if self.instance else None

    def get_current_config(self) -> Dict[str, str]:
        """Get the current configuration from .env file"""
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        config = {}
        
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                for line in f:
                    if line.strip() and not line.startswith('#'):
                        try:
                            key, value = line.strip().split('=', 1)
                            if key.startswith('SNOW_'):  # Only return ServiceNow related configs
                                config[key] = value
                        except ValueError:
                            continue
        return config

    def update_config(self, config: Dict[str, str]):
        """Update the .env file with new configuration"""
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
        
        # Read existing .env file
        env_vars = {}
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                for line in f:
                    if line.strip() and not line.startswith('#'):
                        try:
                            key, value = line.strip().split('=', 1)
                            env_vars[key] = value
                        except ValueError:
                            continue

        # Update with new config
        env_vars.update(config)

        # Write back to .env file
        with open(env_path, 'w') as f:
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")

        # Update instance variables
        self.instance = config.get('SNOW_INSTANCE', self.instance)
        self.auth = (config.get('SNOW_USERNAME', self.auth[0]), 
                    config.get('SNOW_PASSWORD', self.auth[1]))
        self.base_url = f"https://{self.instance}/api/now" if self.instance else None

    def create_incident(self, incident_data: IncidentCreate):
        if not self.base_url:
            raise HTTPException(status_code=500, detail="ServiceNow configuration is missing")
            
        url = f"{self.base_url}/table/incident"
        payload = {
            "short_description": incident_data.title,
            "description": incident_data.description,
            "priority": incident_data.priority,
            "category": incident_data.category
        }
        
        response = requests.post(
            url,
            auth=self.auth,
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 201:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        return response.json()["result"]

    def get_incident(self, incident_id: str):
        if not self.base_url:
            raise HTTPException(status_code=500, detail="ServiceNow configuration is missing")
            
        url = f"{self.base_url}/table/incident/{incident_id}"
        response = requests.get(
            url,
            auth=self.auth,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        return response.json()["result"]

snow_api = ServiceNowAPI()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "config": {
            "instance": snow_api.instance,
            "username": snow_api.auth[0] if snow_api.auth else None,
            "configured": bool(snow_api.base_url)
        }
    }

@app.get("/api/mcp/config")
async def get_config():
    try:
        config = snow_api.get_current_config()
        return {"success": True, "config": config}
    except Exception as e:
        logger.error(f"Error getting configuration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/mcp/config")
async def update_config(config_update: ConfigUpdate):
    try:
        snow_api.update_config(config_update.config)
        logger.info("Configuration updated successfully")
        return {"success": True, "message": "Configuration updated successfully"}
    except Exception as e:
        logger.error(f"Error updating configuration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mcp/incident")
async def create_incident(incident: IncidentCreate):
    try:
        result = snow_api.create_incident(incident)
        logger.info(f"Incident created successfully: {result['sys_id']}")
        return {"success": True, "incidentId": result["sys_id"]}
    except Exception as e:
        logger.error(f"Error creating incident: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mcp/incident/{incident_id}")
async def get_incident(incident_id: str):
    try:
        incident = snow_api.get_incident(incident_id)
        return incident
    except Exception as e:
        logger.error(f"Error fetching incident: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mcp/reload")
async def reload_server():
    try:
        # Reload environment variables
        load_dotenv(override=True)
        
        # Update global variables
        global PORT, SNOW_INSTANCE, SNOW_USERNAME, SNOW_PASSWORD
        PORT = os.getenv("PORT", "3002")
        SNOW_INSTANCE = os.getenv("SNOW_INSTANCE")
        SNOW_USERNAME = os.getenv("SNOW_USERNAME")
        SNOW_PASSWORD = os.getenv("SNOW_PASSWORD")
        
        # Update ServiceNow API instance with new config
        snow_api.instance = SNOW_INSTANCE
        snow_api.auth = (SNOW_USERNAME, SNOW_PASSWORD)
        snow_api.base_url = f"https://{SNOW_INSTANCE}/api/now" if SNOW_INSTANCE else None
        
        logger.info("Server reloaded successfully with new configuration")
        return {"success": True, "message": "Server reloaded successfully"}
    except Exception as e:
        logger.error(f"Error reloading server: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mcp/activities")
async def get_activities():
    """Get all activities from ServiceNow server."""
    try:
        # For now, return sample activities
        activities = [
            {
                "id": "snow-1",
                "timestamp": datetime.now().isoformat(),
                "type": "incident_created",
                "source": "servicenow",
                "target": "client",
                "payload": {
                    "incident_id": "INC001",
                    "title": "Service Degradation",
                    "priority": "high"
                },
                "status": "success"
            },
            {
                "id": "snow-2",
                "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
                "type": "incident_updated",
                "source": "servicenow",
                "target": "client",
                "payload": {
                    "incident_id": "INC002",
                    "status": "in_progress"
                },
                "status": "success"
            }
        ]
        return activities
    except Exception as e:
        logger.error(f"Error getting activities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3002) 