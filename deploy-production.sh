#!/bin/bash
set -e

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting DelPresence Frontend Deployment ===${NC}"

# Check if .env file exists, if not create from example
if [ ! -f .env ]; then
    echo -e "${BLUE}Creating .env file from template...${NC}"
    cp env.example .env
    echo -e "${GREEN}Created .env file. Please edit with your production values!${NC}"
    echo -e "${GREEN}Don't forget to set your NEXT_PUBLIC_API_URL to point to your backend!${NC}"
    exit 1
fi

# Pull latest changes if in git repository
if [ -d .git ]; then
    echo -e "${BLUE}Pulling latest changes...${NC}"
    git pull
fi

# Build and start the containers in detached mode
echo -e "${BLUE}Building and starting Docker container...${NC}"
docker-compose build --no-cache
docker-compose up -d

echo -e "${GREEN}=== DelPresence Frontend has been deployed successfully! ===${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}Make sure your backend is running separately${NC}" 