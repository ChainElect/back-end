# Base image
FROM node:18-alpine

# Set environment variables for canvas
ENV PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig
ENV LDFLAGS="-L/usr/lib/x86_64-linux-gnu"
ENV CPPFLAGS="-I/usr/include"

# Set working directory
WORKDIR /app

# Install necessary build tools for canvas and sharp
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the app's port
EXPOSE 5001

# Start the backend server
CMD ["node", "server.js"]