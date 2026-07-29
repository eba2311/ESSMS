#!/bin/bash

# Ethiopian Secondary School Management System - Development Startup Script
echo ""
echo "========================================"
echo "ESSMS Development Server Startup"
echo "========================================"
echo ""

# Check if node_modules exist in server
if [ ! -d "server/node_modules" ]; then
    echo "Installing server dependencies..."
    cd server
    npm install
    cd ..
fi

# Check if node_modules exist in client
if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client