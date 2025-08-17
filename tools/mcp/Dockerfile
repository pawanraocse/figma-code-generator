# MCP Server Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY tools/mcp/src ./src
EXPOSE 4000
CMD ["npx", "ts-node", "src/server.ts"]

