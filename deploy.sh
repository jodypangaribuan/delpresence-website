# Create required directories
mkdir -p nginx/logs

# Set environment variable with actual VPS IP
export NEXT_PUBLIC_API_URL=http://$(hostname -I | awk '{print $1}')/api

# Check if Next.js app exists
if [ ! -d "nextjs" ]; then
  echo "Error: nextjs directory not found!"
  exit 1
fi

# Stop any existing containers
docker-compose down

# Build and start containers
docker-compose up --build -d

# Check if containers are running
echo "Checking container status..."
docker-compose ps

# Check logs
echo "Checking Nginx logs..."
docker-compose logs nginx

echo "Checking Next.js logs..."
docker-compose logs nextjs

echo "You should now be able to access your app at: http://$(hostname -I | awk '{print $1}')"
echo "If not, check if port 80 is open in your firewall with: sudo ufw status" 
