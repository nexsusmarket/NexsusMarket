# 1. Use a base image that has both Node.js and Python pre-installed
FROM nikolaik/python-nodejs:python3.10-nodejs20

# 2. Set the working directory inside the server
WORKDIR /usr/src/app

# 3. Copy Python requirements and install them
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy Node.js package files and install them
COPY package*.json ./
RUN npm install

# 5. Copy the rest of your application code
COPY . .

# 6. Build the React frontend
RUN npm run build

# 7. Expose the port your app runs on
EXPOSE 3000

# 8. Start the server
CMD ["node", "server.js"]