# MCP Server

Minimal MCP server for Figma proxy, token management, and progress tracking.

## Usage

- Start server: `npm run mcp:dev` (dev) or `npm run mcp:start` (prod)
- Endpoints:
  - `POST /v1/fetch/file` — fetch Figma file (stub)
  - `GET /v1/assets/:sha/:name` — get asset (stub)
  - `POST /v1/token/rotate` — rotate token (stub)
  - `POST /v1/progress` — append progress (stub)
  - `GET /v1/health` — health check
  - `GET /metrics` — metrics (stub)

## Environment Variables
- `MCP_PORT` — server port (default: 4000)
- `MCP_API_KEY` — required for protected endpoints

## Docker
- Build: `docker build -t mcp-server tools/mcp/`
- Run: `docker run -p 4000:4000 -e MCP_API_KEY=yourkey mcp-server`

## Notes
- All endpoints are stubbed for initial setup.
- No secrets or tokens are logged.
- Append-only progress.md integration is planned for next steps.

