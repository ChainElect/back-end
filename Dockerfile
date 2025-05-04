# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install compiler toolchain, Python (with distutils), pkg-config, and native libs for canvas & sharp
RUN apk add --no-cache \
    build-base \
    python3 \
    python3-dev \
    py3-setuptools \
    pkgconfig \
    cairo-dev \
    pango-dev \
    libjpeg-turbo-dev \
    giflib-dev \
    libwebp-dev \
    librsvg-dev \
    vips-dev

# Copy manifest and install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Expose port and start
EXPOSE 5001
CMD ["node", "server.js"]
