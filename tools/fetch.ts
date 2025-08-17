// tools/fetch.ts
import axios from 'axios';
import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';

const program = new Command();
program
  .requiredOption('--file <fileId>', 'Figma file ID')
  .option('--nodes <nodeIds>', 'Comma-separated node IDs')
  .requiredOption('--out <outPath>', 'Output path for Figma JSON');
program.parse(process.argv);
const opts = program.opts();

const MCP_URL = process.env.MCP_URL;
const MCP_API_KEY = process.env.MCP_API_KEY;
if (!MCP_URL || !MCP_API_KEY) {
  console.error('Missing MCP_URL or MCP_API_KEY in environment');
  process.exit(1);
}

async function appendProgress(entry: any) {
  const progressPath = path.resolve('progress.md');
  let block = `- step_id: ${entry.step_id}\n  description: ${entry.description}\n  status: ${entry.status}\n  started_at: ${entry.started_at}\n  finished_at: ${entry.finished_at}\n  command: ${entry.command}\n  inputs: ${JSON.stringify(entry.inputs)}\n  outputs: ${JSON.stringify(entry.outputs)}\n  artifacts: ${JSON.stringify(entry.artifacts)}\n  sha: ${entry.sha}\n  notes: ${entry.notes || ''}\n  error: ${entry.error || ''}\n`;
  await fs.appendFile(progressPath, block);
}

async function updateContext(context: any) {
  const contextPath = path.resolve('tools/cache/context.json');
  await fs.writeFile(contextPath, JSON.stringify(context, null, 2));
}

async function fetchWithRetry(payload: any, maxRetries = 3) {
  let attempt = 0;
  let lastError = null;
  while (attempt < maxRetries) {
    try {
      const res = await axios.post(`${MCP_URL}/v1/fetch/file`, payload, {
        headers: { 'x-api-key': MCP_API_KEY }
      });
      return res;
    } catch (err: any) {
      lastError = err;
      const statusCode = err?.response?.status;
      if (statusCode === 404 || statusCode === 429 || statusCode >= 500) {
        const wait = Math.pow(2, attempt) * 1000;
        console.error(`Fetch attempt ${attempt + 1} failed (status ${statusCode}). Retrying in ${wait / 1000}s...`);
        await new Promise(r => setTimeout(r, wait));
        attempt++;
      } else {
        break;
      }
    }
  }
  throw lastError;
}

async function main() {
  const startedAt = new Date().toISOString();
  const stepId = `fetch.figma.${startedAt}`;
  await appendProgress({
    step_id: stepId,
    description: 'Figma fetch started',
    status: 'in-progress',
    started_at: startedAt,
    finished_at: null,
    command: `npm run fetch -- --file ${opts.file} --nodes ${opts.nodes || ''} --out ${opts.out}`,
    inputs: opts,
    outputs: [],
    artifacts: [],
    sha: null,
    notes: '',
    error: ''
  });

  try {
    const payload = {
      fileId: opts.file,
      nodeIds: opts.nodes ? opts.nodes.split(',') : [],
      scale: 2,
      format: 'svg'
    };
    const res = await fetchWithRetry(payload, 3);
    const { sha, jsonPath, assets } = res.data;
    // Read Figma JSON directly from disk
    const figmaJsonPath = path.resolve(jsonPath);
    let figmaJson;
    try {
      figmaJson = await fs.readFile(figmaJsonPath, 'utf-8');
      // Optionally parse to validate
      JSON.parse(figmaJson);
    } catch (readErr) {
      console.error('Failed to read Figma JSON from disk:', readErr);
      throw readErr;
    }
    // Write fetch metadata
    const metaPath = path.resolve(`tools/cache/fetch-meta-${sha}.json`);
    await fs.writeFile(metaPath, JSON.stringify({ sha, fileId: opts.file, nodeIds: payload.nodeIds, assets }, null, 2));
    // Update context
    await updateContext({
      last_sha: sha,
      last_step: stepId,
      schemaPath: '',
      tokensPath: ''
    });
    const finishedAt = new Date().toISOString();
    await appendProgress({
      step_id: stepId,
      description: 'Figma fetch done',
      status: 'done',
      started_at: startedAt,
      finished_at: finishedAt,
      command: `npm run fetch -- --file ${opts.file} --nodes ${opts.nodes || ''} --out ${opts.out}`,
      inputs: opts,
      outputs: [figmaJsonPath, metaPath],
      artifacts: [figmaJsonPath, metaPath],
      sha,
      notes: 'Fetch completed successfully',
      error: ''
    });
  } catch (err: any) {
    const finishedAt = new Date().toISOString();
    let errorMsg = err?.response?.data?.error || err?.message || 'Unknown error';
    let statusCode = err?.response?.status;
    let notes = '';
    // Print MCP response body for diagnostics
    if (err?.response?.data) {
      console.error('MCP response error:', JSON.stringify(err.response.data, null, 2));
    }
    if (statusCode === 404) {
      notes = 'Figma file not found. Check FIGMA_FILE_ID, MCP token, and Figma permissions.';
      console.error('Troubleshooting: Ensure the Figma file ID is correct, the MCP token has access, and the file is not deleted or private.');
    } else if (statusCode === 401) {
      notes = 'Unauthorized. Check MCP_API_KEY and MCP server.';
      console.error('Troubleshooting: Ensure MCP_API_KEY is correct and matches the MCP server configuration.');
    } else if (statusCode === 500) {
      notes = 'MCP server error. Check MCP logs.';
      console.error('Troubleshooting: Check MCP server logs for details.');
    } else {
      notes = 'Fetch failed. Check MCP server and network.';
      console.error('Troubleshooting: Check MCP server status and network connectivity.');
    }
    await appendProgress({
      step_id: stepId,
      description: 'Figma fetch blocked',
      status: 'blocked',
      started_at: startedAt,
      finished_at: finishedAt,
      command: `npm run fetch -- --file ${opts.file} --nodes ${opts.nodes || ''} --out ${opts.out}`,
      inputs: opts,
      outputs: [],
      artifacts: [],
      sha: null,
      notes,
      error: errorMsg
    });
    console.error(`Fetch failed: ${errorMsg}`);
    process.exit(2);
  }
}

main();
