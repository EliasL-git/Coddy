FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json package-lock.json* ./
RUN npm install --only=production

# Bundle app source
COPY . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]
