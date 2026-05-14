# Build frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./frontend/
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps
COPY frontend/ .
RUN npm run build

# Final image: run backend and serve built frontend from /public
FROM node:20-alpine
WORKDIR /usr/src/app
# Install backend deps
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --only=production --legacy-peer-deps
# Copy backend source
COPY backend/ ./
# Copy frontend build into backend public folder
COPY --from=builder /app/frontend/dist ./public
ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm", "start"]
