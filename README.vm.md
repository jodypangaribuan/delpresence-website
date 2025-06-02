# Running on a VM

When deploying to a VM, follow these steps:

1. Clone the repository
   ```
   git clone https://github.com/jodypangaribuan/delpresence-website.git
   cd delpresence-website
   ```

2. Create a .env file with the correct API URL
   ```
   echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env
   ```

3. Start the backend
   ```
   cd backend
   docker-compose up -d
   ```

4. Start the frontend
   ```
   npm install
   npm run build
   npm start
   ```

The backend API should now be accessible from the frontend. 