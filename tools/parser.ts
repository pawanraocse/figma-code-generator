// tools/parser.ts
function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();
}

function validateSchema(obj: any): boolean {
  if (!obj.id || !obj.name || !obj.type || !obj.layerType || !obj.props || !obj.style || !Array.isArray(obj.children)) return false;
  if (!Array.isArray(obj.tokensUsed) || obj.tokensUsed.some((t: string) => typeof t !== 'string')) return false;
  return true;
}

async function appendProgress(entry: any) {
  const pathModule = await import('path');
  const fsModule = await import('fs/promises');
  const progressPath = pathModule.resolve('progress.md');
  let block = `- step_id: ${entry.step_id}\n  description: ${entry.description}\n  status: ${entry.status}\n  started_at: ${entry.started_at}\n  finished_at: ${entry.finished_at}\n  command: ${entry.command}\n  inputs: ${JSON.stringify(entry.inputs)}\n  outputs: ${JSON.stringify(entry.outputs)}\n  artifacts: ${JSON.stringify(entry.artifacts)}\n  sha: ${entry.sha}\n  notes: ${entry.notes || ''}\n  error: ${entry.error || ''}\n`;
  await fsModule.appendFile(progressPath, block);
}

async function updateContext(context: any) {
  const pathModule = await import('path');
  const fsModule = await import('fs/promises');
  const contextPath = pathModule.resolve('tools/cache/context.json');
  await fsModule.writeFile(contextPath, JSON.stringify(context, null, 2));
}

function extractNode(node: any): any {
  // Map Figma node types to canonical schema types
  let type = node.type || node.nodeType || 'FRAME';
  let layerType = type.toLowerCase();
  let props = {
    x: node.absoluteBoundingBox?.x || node.x || 0,
    y: node.absoluteBoundingBox?.y || node.y || 0,
    w: node.absoluteBoundingBox?.width || node.width || 0,
    h: node.absoluteBoundingBox?.height || node.height || 0,
    metadata: node.metadata || {},
    ...(type === 'TEXT' && node.characters ? { text: node.characters } : {})
  };
  let style = {
    fills: node.fills || [],
    strokes: node.strokes || [],
    font: node.style?.fontFamily ? {
      family: node.style.fontFamily,
      size: node.style.fontSize,
      weight: node.style.fontWeight || ''
    } : { family: '', size: 0, weight: '' },
    spacing: node.style?.spacing ? node.style.spacing : { padding: 0, margin: 0 },
    tokens: node.tokens || { color: '', spacing: '' }
  };
  let tokensUsed = [];
  if (style.tokens.color) tokensUsed.push(style.tokens.color);
  if (style.tokens.spacing) tokensUsed.push(style.tokens.spacing);
  let children = Array.isArray(node.children) ? node.children.map(extractNode) : [];
  let name = kebabCase(node.name || node.id || 'unnamed');
  let out = {
    id: node.id || name,
    name,
    type,
    layerType,
    props,
    children,
    style,
    tokensUsed
  };
  return out;
}

async function main() {
  const { Command } = await import('commander');
  const pathModule = await import('path');
  const fsModule = await import('fs/promises');
  const cryptoModule = await import('crypto');

  const program = new Command();
  program
    .requiredOption('--input <inputPath>', 'Input Figma JSON path')
    .option('--out <outPath>', 'Output canonical schema path');
  program.parse(process.argv);
  const opts = program.opts();

  const startedAt = new Date().toISOString();
  const stepId = `parser.canonical.${startedAt}`;
  await appendProgress({
    step_id: stepId,
    description: 'Parser started',
    status: 'in-progress',
    started_at: startedAt,
    finished_at: null,
    command: `npm run parse -- --input ${opts.input} --out ${opts.out || ''}`,
    inputs: opts,
    outputs: [],
    artifacts: [],
    sha: null,
    notes: '',
    error: ''
  });

  try {
    const inputPath = pathModule.resolve(opts.input);
    const raw = await fsModule.readFile(inputPath, 'utf-8');
    const figmaData = JSON.parse(raw);
    // Parse Figma document tree
    let rootNode = figmaData.document || figmaData;
    let canonical = extractNode(rootNode);
    if (!validateSchema(canonical)) throw new Error('Schema validation failed');
    const sha = cryptoModule.createHash('sha1').update(JSON.stringify(canonical)).digest('hex');
    const outPath = opts.out ? pathModule.resolve(opts.out) : pathModule.resolve(`tools/cache/schema-${sha}.json`);
    await fsModule.writeFile(outPath, JSON.stringify(canonical, null, 2));
    await updateContext({
      last_sha: sha,
      last_step: stepId,
      schemaPath: outPath,
      tokensPath: ''
    });
    const finishedAt = new Date().toISOString();
    await appendProgress({
      step_id: stepId,
      description: 'Parser done',
      status: 'done',
      started_at: startedAt,
      finished_at: finishedAt,
      command: `npm run parse -- --input ${opts.input} --out ${opts.out || ''}`,
      inputs: opts,
      outputs: [outPath],
      artifacts: [outPath],
      sha,
      notes: 'Canonical schema generated',
      error: ''
    });
    console.log(`Canonical schema written: ${outPath}`);
  } catch (err: any) {
    const finishedAt = new Date().toISOString();
    await appendProgress({
      step_id: stepId,
      description: 'Parser blocked',
      status: 'blocked',
      started_at: startedAt,
      finished_at: finishedAt,
      command: `npm run parse -- --input ${opts.input} --out ${opts.out || ''}`,
      inputs: opts,
      outputs: [],
      artifacts: [],
      sha: null,
      notes: '',
      error: err.message || 'Unknown error'
    });
    console.error('Parser failed:', err.message);
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}

export { kebabCase, validateSchema };
