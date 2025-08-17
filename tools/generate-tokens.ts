// tools/generate-tokens.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

async function readSchema(schemaPath: string) {
  const raw = await fs.readFile(schemaPath, 'utf-8');
  return JSON.parse(raw);
}

function extractTokens(schema: any) {
  const colorTokens = new Set<string>();
  const spacingTokens = new Set<string>();
  function walk(node: any) {
    if (node.style?.tokens?.color) colorTokens.add(node.style.tokens.color);
    if (node.style?.tokens?.spacing) spacingTokens.add(node.style.tokens.spacing);
    if (Array.isArray(node.children)) node.children.forEach(walk);
  }
  walk(schema);
  return { colorTokens: Array.from(colorTokens), spacingTokens: Array.from(spacingTokens) };
}

function scssContent(tokens: { colorTokens: string[], spacingTokens: string[] }) {
  let out = '// Auto-generated SCSS tokens\n';
  tokens.colorTokens.forEach(t => out += `$color-${t}: #000000;\n`);
  tokens.spacingTokens.forEach(t => out += `$spacing-${t}: 8px;\n`);
  return out;
}

function cssContent(tokens: { colorTokens: string[], spacingTokens: string[] }) {
  let out = '/* Auto-generated CSS tokens */\n:root {\n';
  tokens.colorTokens.forEach(t => out += `  --color-${t}: #000000;\n`);
  tokens.spacingTokens.forEach(t => out += `  --spacing-${t}: 8px;\n`);
  out += '}\n';
  return out;
}

async function main() {
  const schemaPath = process.argv[2] || 'tools/cache/schema-latest.json';
  const schema = await readSchema(schemaPath);
  const tokens = extractTokens(schema);
  const scssPath = path.resolve('src/styles/_tokens.scss');
  const cssPath = path.resolve('src/styles/tokens.css');
  await fs.writeFile(scssPath, scssContent(tokens));
  await fs.writeFile(cssPath, cssContent(tokens));
  const sha = crypto.createHash('sha1').update(scssContent(tokens) + cssContent(tokens)).digest('hex');
  // Update context.json
  const contextPath = path.resolve('tools/cache/context.json');
  let context: any = {};
  try { context = JSON.parse(await fs.readFile(contextPath, 'utf-8')); } catch {}
  context.tokensPath = scssPath;
  context.tokensSha = sha;
  await fs.writeFile(contextPath, JSON.stringify(context, null, 2));
  // Append progress.md
  const progressPath = path.resolve('progress.md');
  const startedAt = new Date().toISOString();
  let block = `- step_id: tokens.generated\n  description: Tokens generated from schema\n  status: done\n  started_at: ${startedAt}\n  finished_at: ${startedAt}\n  command: generate-tokens ${schemaPath}\n  inputs: { schemaPath: '${schemaPath}' }\n  outputs: ['${scssPath}', '${cssPath}']\n  artifacts: ['${scssPath}', '${cssPath}']\n  sha: ${sha}\n  notes: 'SCSS and CSS tokens generated'\n`;
  await fs.appendFile(progressPath, block);
  console.log(`Tokens generated: ${scssPath}, ${cssPath}`);
}

if (require.main === module) {
  main();
}

export { extractTokens, scssContent, cssContent };
