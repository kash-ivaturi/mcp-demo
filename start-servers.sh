#!/bin/bash

# Start M365 server
cd mcp-server-m365
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py &
M365_PID=$!

# Start ServiceNow server
cd ../mcp-server-snow
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py &
SNOW_PID=$!

# Start React client
cd ../mcp-client
npm install
npm start &
CLIENT_PID=$!

# Function to handle cleanup on script exit
cleanup() {
    echo "Stopping servers..."
    kill $M365_PID
    kill $SNOW_PID
    kill $CLIENT_PID
    exit 0
}

# Set up trap to catch script termination
trap cleanup SIGINT SIGTERM

# Keep script running
echo "All servers started. Press Ctrl+C to stop all servers."
wait 