#!/bin/bash
# Simple script to deploy the face recognition service

# Stop running containers if they exist
docker-compose down

# Build and start the service
docker-compose up -d --build

# Check if service is running
sleep 5
echo "Checking service health..."
if curl -s http://localhost:5000/health | grep -q "ok"; then
    echo "✅ Face recognition service deployed successfully!"
else
    echo "❌ Service health check failed. Check logs with: docker-compose logs face-recognition"
    echo "Showing logs:"
    docker-compose logs face-recognition
fi

echo ""
echo "Service should be available at: http://$(hostname -I | awk '{print $1}'):5000"
echo "To check logs: docker-compose logs -f face-recognition" 