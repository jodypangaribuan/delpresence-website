#!/bin/bash

echo "==== CHECKING DOCKER CONTAINER STATUS ===="
docker-compose ps

echo -e "\n==== CHECKING NETWORK ===="
echo "Docker networks:"
docker network ls
echo -e "\nNetwork details for app-network:"
docker network inspect app-network

echo -e "\n==== CHECKING PORT 80 ===="
echo "Processes using port 80:"
sudo netstat -tulpn | grep 80 || echo "No process using port 80 (may need to install net-tools)"

echo -e "\n==== CHECKING FIREWALL ===="
sudo ufw status || echo "UFW not installed or not running"

echo -e "\n==== CHECKING NGINX LOGS ===="
docker-compose logs nginx

echo -e "\n==== CHECKING NEXTJS LOGS ===="
docker-compose logs nextjs

echo -e "\n==== CHECKING NGINX CONFIGURATION ===="
docker-compose exec nginx nginx -t || echo "Could not check nginx configuration"

echo -e "\n==== TRYING CURL FROM INSIDE NGINX CONTAINER ===="
docker-compose exec nginx curl -I http://nextjs:3000 || echo "Failed to connect to nextjs from nginx container"

echo -e "\n==== CHECKING HOST DETAILS ===="
echo "Hostname: $(hostname)"
echo "IP Addresses: $(hostname -I)"

echo -e "\n==== SUGGESTIONS ===="
echo "1. If nginx cannot connect to nextjs, ensure both containers are on the same network"
echo "2. If port 80 is in use by another service, stop that service or change the port in docker-compose.yml"
echo "3. If the firewall is blocking port 80, run: sudo ufw allow 80/tcp"
echo "4. If no obvious issues are found, try restarting the containers: docker-compose down && docker-compose up -d" 