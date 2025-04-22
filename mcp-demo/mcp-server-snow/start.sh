#!/bin/bash

# Kill any existing process on port 3002
lsof -ti :3002 | xargs kill -9 2>/dev/null

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set PYTHONPATH and start the server
export PYTHONPATH=$PWD
uvicorn src.server:app --host 0.0.0.0 --port 3002 