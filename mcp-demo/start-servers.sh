#!/bin/bash

# Function to start a server
start_server() {
    local server_dir=$1
    local server_name=$2
    
    echo "Starting $server_name server..."
    cd "$server_dir" || exit
    ./start.sh &
    cd ..
    echo "$server_name server started"
}

# Kill any existing processes
lsof -ti :3001 | xargs kill -9 2>/dev/null
lsof -ti :3002 | xargs kill -9 2>/dev/null

# Start both servers
start_server "mcp-server-m365" "M365"
start_server "mcp-server-snow" "ServiceNow"

# Wait for servers to start
sleep 5

# Check if servers are running
echo "Checking server status..."
curl -s http://localhost:3001/health || echo "M365 server not responding"
curl -s http://localhost:3002/health || echo "ServiceNow server not responding"

echo "Servers started. Press Ctrl+C to stop all servers."
wait 