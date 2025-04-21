from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from loguru import logger
import os
from dotenv import load_dotenv
import requests
from typing import Optional
import json

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

class ServiceNowAPI:
    def __init__(self):
        self.instance = SNOW_INSTANCE
        self.auth = (SNOW_USERNAME, SNOW_PASSWORD)
        self.base_url = f"https://{self.instance}/api/now"

    def create_incident(self, incident_data: IncidentCreate):
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
        "timestamp": datetime.datetime.now().isoformat()
    }

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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3000))
    uvicorn.run(app, host="0.0.0.0", port=port) 