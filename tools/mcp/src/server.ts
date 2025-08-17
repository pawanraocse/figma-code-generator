// MCP Server - Express skeleton
// File: tools/mcp/src/server.ts

import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(bodyParser.json());

const PORT = process.env.MCP_PORT || 4000;
const API_KEY = process.env.MCP_API_KEY || '';
const FIGMA_TOKEN = process.env.FIGMA_API_KEY || '';

// Middleware to require API key
function requireApiKey(req: Request, res: Response, next: NextFunction) {
  if (!API_KEY || req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// POST /v1/fetch/file
app.post('/v1/fetch/file', requireApiKey, async (req: Request, res: Response) => {
  console.log('Fetch request payload:', req.body);
  console.log('Fetch request headers:', req.headers);
  try {
    const { fileId, nodeIds, scale, format } = req.body;
    if (!fileId) return res.status(400).json({ error: 'Missing fileId' });
    if (!FIGMA_TOKEN) return res.status(500).json({ error: 'Missing Figma token in MCP server env' });

    // Log Figma API call details (mask token)
    console.log(`[MCP] Fetching Figma file: fileId=${fileId}, token=${FIGMA_TOKEN.slice(0,6)}...`);
    const figmaUrl = `https://api.figma.com/v1/files/${fileId}`;
    let figmaRes;
    try {
      figmaRes = await axios.get(figmaUrl, {
        headers: { 'X-Figma-Token': FIGMA_TOKEN }
      });
    } catch (figmaErr: any) {
      // Log Figma API error details
      const status = figmaErr?.response?.status;
      const data = figmaErr?.response?.data;
      const headers = figmaErr?.response?.headers;
      console.error(`[MCP] Figma API error: status=${status}, fileId=${fileId}, token=${FIGMA_TOKEN.slice(0,6)}..., message=${JSON.stringify(data)}, headers=${JSON.stringify(headers)}`);
      return res.status(status || 500).json({ error: data, fileId, token: FIGMA_TOKEN.slice(0,6) + '...', headers });
    }
    let figmaJson;
    try {
      figmaRes = await axios.get(figmaUrl, {
        headers: { 'X-Figma-Token': FIGMA_TOKEN }
      });
      figmaJson = figmaRes.data;
    } catch (figmaErr: any) {
      // Log Figma API error details
      const status = figmaErr?.response?.status;
      const data = figmaErr?.response?.data;
      const headers = figmaErr?.response?.headers;
      console.error(`[MCP] Figma API error: status=${status}, fileId=${fileId}, token=${FIGMA_TOKEN.slice(0,6)}..., message=${JSON.stringify(data)}, headers=${JSON.stringify(headers)}`);
      return res.status(status || 500).json({ error: data, fileId, token: FIGMA_TOKEN.slice(0,6) + '...', headers });
    }
    // Only write and return jsonPath if figmaJson exists
    if (!figmaJson) {
      return res.status(500).json({ error: 'Figma JSON not available', fileId });
    }
    // Compute sha
    const sha = require('crypto').createHash('sha1').update(JSON.stringify(figmaJson)).digest('hex');
    const jsonPath = `tools/cache/figma-${sha}.json`;
    try {
      fs.writeFileSync(jsonPath, JSON.stringify(figmaJson, null, 2));
    } catch (writeErr) {
      console.error(`[MCP] Failed to write Figma JSON: ${writeErr}`);
      return res.status(500).json({ error: 'Failed to write Figma JSON', fileId });
    }

    // Optionally, extract assets (stub for now)
    const assets: string[] = [];
    res.json({ sha, jsonPath, assets });
  } catch (err: any) {
    console.error('[MCP] Fetch error:', err.message);
    res.status(500).json({ error: err.message || 'Unknown error', fileId: req.body.fileId });
  }
});

// GET /v1/assets/:sha/:name
app.get('/v1/assets/:sha/:name', requireApiKey, (req: Request, res: Response) => {
  const { sha, name } = req.params;
  const assetPath = path.resolve(__dirname, '../../cache/assets', sha, name);
  console.log(`[ASSET] Requested: sha=${sha}, name=${name}, resolvedPath=${assetPath}`);
  // For now, always return 404 (stub)
  res.status(404).json({ error: 'Asset not found (stub)', sha, name });
});

// POST /v1/token/rotate
app.post('/v1/token/rotate', requireApiKey, (req: Request, res: Response) => {
  res.json({ status: 'Token rotation stubbed' });
});

// POST /v1/progress
app.post('/v1/progress', requireApiKey, (req: Request, res: Response) => {
  // Append to progress.md (stub)
  res.json({ status: 'Progress entry stubbed' });
});

// GET /v1/health
app.get('/v1/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /metrics
app.get('/metrics', (req, res) => {
  res.send('# Metrics stub');
});

app.listen(PORT, () => {
  console.log(`MCP server running on port ${PORT}`);
  console.log('MCP server environment:', process.env);
});

// Error handling for uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
