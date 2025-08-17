import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const PROGRESS_PATH = path.resolve('progress.md');
const CONTEXT_PATH = path.resolve('tools/cache/context.json');
const ENV_PATH = path.resolve('.env');

function logStep(stepId: string, description: string, status: string, command: string, inputs: any, outputs: string[], artifacts: string[], sha: string | null, notes: string, error: string) {
  const entry = `- step_id: ${stepId}\n  description: ${description}\n  status: ${status}\n  started_at: ${new Date().toISOString()}\n  finished_at: ${status === 'done' ? new Date().toISOString() : 'null'}\n  command: ${command}\n  inputs: ${JSON.stringify(inputs)}\n  outputs: ${JSON.stringify(outputs)}\n  artifacts: ${JSON.stringify(artifacts)}\n  sha: ${sha}\n  notes: ${notes}\n  error: ${error}\n`;
  fs.appendFileSync(PROGRESS_PATH, entry);
}

function updateContext(last_sha: string, last_step: string, schemaPath: string, tokensPath: string) {
  fs.writeFileSync(CONTEXT_PATH, JSON.stringify({ last_sha, last_step, schemaPath, tokensPath }, null, 2));
}

function runStep(command: string, env?: Record<string, string>) {
  try {
    execSync(command, { stdio: 'inherit', env: { ...process.env, ...env } });
    return true;
  } catch (err) {
    return false;
  }
}

function parseEnv(envPath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return env;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) {
      env[match[1]] = match[2];
    }
  }
  return env;
}

function main() {
  const env = parseEnv(ENV_PATH);
  const figmaFileId = env.FIGMA_FILE_ID;
  const mcpUrl = env.MCP_URL;
  const mcpApiKey = env.MCP_API_KEY;
  if (!figmaFileId || !mcpUrl || !mcpApiKey) {
    console.error('Error: FIGMA_FILE_ID, MCP_URL, and MCP_API_KEY must be set in .env');
    process.exit(1);
  }
  // 1. Fetch Figma design
  logStep('fetch.figma', 'Fetch Figma design', 'in-progress', `npm run fetch -- --file ${figmaFileId} --out tools/cache/figma-dev-sha.json`, { file: figmaFileId, out: 'tools/cache/figma-dev-sha.json', mcpUrl, mcpApiKey }, [], [], null, '', '');
  if (!runStep(`npm run fetch -- --file ${figmaFileId} --out tools/cache/figma-dev-sha.json`, env)) {
    logStep('fetch.figma', 'Fetch Figma design', 'blocked', `npm run fetch -- --file ${figmaFileId} --out tools/cache/figma-dev-sha.json`, { file: figmaFileId, out: 'tools/cache/figma-dev-sha.json', mcpUrl, mcpApiKey }, [], [], null, '', 'Fetch failed');
    process.exit(2);
  }
  logStep('fetch.figma', 'Fetch Figma design', 'done', `npm run fetch -- --file ${figmaFileId} --out tools/cache/figma-dev-sha.json`, { file: figmaFileId, out: 'tools/cache/figma-dev-sha.json', mcpUrl, mcpApiKey }, ['tools/cache/figma-dev-sha.json'], ['tools/cache/figma-dev-sha.json'], 'dev-sha', 'Fetch completed', '');
  updateContext('dev-sha', 'fetch.figma', 'tools/cache/schema-dev-sha.json', 'src/styles/_tokens.scss');

  // 2. Parse to canonical schema
  logStep('parser.canonical', 'Parse Figma JSON to canonical schema', 'in-progress', 'npm run parse -- --input tools/cache/figma-dev-sha.json --out tools/cache/schema-dev-sha.json', { input: 'tools/cache/figma-dev-sha.json', out: 'tools/cache/schema-dev-sha.json' }, [], [], null, '', '');
  if (!runStep('npm run parse -- --input tools/cache/figma-dev-sha.json --out tools/cache/schema-dev-sha.json')) {
    logStep('parser.canonical', 'Parse Figma JSON to canonical schema', 'blocked', 'npm run parse -- --input tools/cache/figma-dev-sha.json --out tools/cache/schema-dev-sha.json', { input: 'tools/cache/figma-dev-sha.json', out: 'tools/cache/schema-dev-sha.json' }, [], [], null, '', 'Parse failed');
    process.exit(1);
  }
  logStep('parser.canonical', 'Parse Figma JSON to canonical schema', 'done', 'npm run parse -- --input tools/cache/figma-dev-sha.json --out tools/cache/schema-dev-sha.json', { input: 'tools/cache/figma-dev-sha.json', out: 'tools/cache/schema-dev-sha.json' }, ['tools/cache/schema-dev-sha.json'], ['tools/cache/schema-dev-sha.json'], 'dev-sha', 'Schema parsed', '');
  updateContext('dev-sha', 'parser.canonical', 'tools/cache/schema-dev-sha.json', 'src/styles/_tokens.scss');

  // 3. Generate tokens
  logStep('tokens.generated', 'Generate SCSS and CSS tokens', 'in-progress', 'npm run generate-tokens tools/cache/schema-dev-sha.json', { schemaPath: 'tools/cache/schema-dev-sha.json' }, [], [], null, '', '');
  if (!runStep('npm run generate-tokens tools/cache/schema-dev-sha.json')) {
    logStep('tokens.generated', 'Generate SCSS and CSS tokens', 'blocked', 'npm run generate-tokens tools/cache/schema-dev-sha.json', { schemaPath: 'tools/cache/schema-dev-sha.json' }, [], [], null, '', 'Token generation failed');
    process.exit(1);
  }
  logStep('tokens.generated', 'Generate SCSS and CSS tokens', 'done', 'npm run generate-tokens tools/cache/schema-dev-sha.json', { schemaPath: 'tools/cache/schema-dev-sha.json' }, ['src/styles/_tokens.scss', 'src/styles/tokens.css'], ['src/styles/_tokens.scss', 'src/styles/tokens.css'], 'dev-sha', 'Tokens generated', '');
  updateContext('dev-sha', 'tokens.generated', 'tools/cache/schema-dev-sha.json', 'src/styles/_tokens.scss');

  // 4. Generate Angular code
  logStep('generator.generated', 'Generate Angular components', 'in-progress', 'npm run generate -- --schema tools/cache/schema-dev-sha.json', { schemaPath: 'tools/cache/schema-dev-sha.json' }, [], [], null, '', '');
  if (!runStep('npm run generate -- --schema tools/cache/schema-dev-sha.json')) {
    logStep('generator.generated', 'Generate Angular components', 'blocked', 'npm run generate -- --schema tools/cache/schema-dev-sha.json', { schemaPath: 'tools/cache/schema-dev-sha.json' }, [], [], null, '', 'Angular code generation failed');
    process.exit(1);
  }
  logStep('generator.generated', 'Generate Angular components', 'done', 'npm run generate -- --schema tools/cache/schema-dev-sha.json', { schemaPath: 'tools/cache/schema-dev-sha.json' }, ['src/app/generated/'], ['src/app/generated/'], 'dev-sha', 'Angular code generated', '');
  updateContext('dev-sha', 'generator.generated', 'tools/cache/schema-dev-sha.json', 'src/styles/_tokens.scss');

  // 5. Validate build
  logStep('build.validate', 'Validate Angular build', 'in-progress', 'ng build', {}, [], [], null, '', '');
  try {
    execSync('ng build', { stdio: 'inherit', cwd: path.resolve('figma-to-angular') });
  } catch (err) {
    logStep('build.validate', 'Validate Angular build', 'blocked', 'ng build', {}, [], [], null, '', 'Build failed');
    process.exit(1);
  }
  logStep('build.validate', 'Validate Angular build', 'done', 'ng build', {}, [], [], 'dev-sha', 'Build succeeded', '');
  updateContext('dev-sha', 'build.validate', 'tools/cache/schema-dev-sha.json', 'src/styles/_tokens.scss');
}

main();
