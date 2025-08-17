// tools/generator.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import ejs from 'ejs';
import { Command } from 'commander';

function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();
}

function className(name: string): string {
  return name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') + 'Component';
}

const tsTemplate = `import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
@Component({
  selector: 'gen-<%= name %>',
  standalone: true,
  templateUrl: './<%= name %>.component.html',
  styleUrls: ['./<%= name %>.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class <%= className %> {
  @Input() data?: any;
}
`;

const htmlTemplate = `<div class="gen-<%= name %>">
  <%- mappedHtml %>
</div>
`;

const scssTemplate = `@import '_tokens.scss';
.gen-<%= name %> {
  @include token-spacing(s-2);
}
`;

function mapNodeToHtml(node: any): string {
  if (node.type === 'RECTANGLE') {
    return `<div class="rectangle" style="width:${node.props.w}px;height:${node.props.h}px;background:${node.style.fills[0]?.color || '#e0e0e0'};border-radius:${node.style.fills[0]?.radius || 0}px;">
      ${node.children.map(mapNodeToHtml).join('')}
    </div>`;
  }
  if (node.type === 'TEXT') {
    return `<span class="rectangle-text" style="font-family:${node.style.font.family};font-size:${node.style.font.size}px;color:${node.style.fills[0]?.color || '#222'};font-weight:${node.style.font.weight};">${node.props.text || ''}</span>`;
  }
  // Default: map children
  return node.children ? node.children.map(mapNodeToHtml).join('') : '';
}

async function generateComponentFiles(component: any, outDir: string) {
  const name = kebabCase(component.name);
  const classNameStr = className(name);
  await fs.mkdir(outDir, { recursive: true });
  const mappedHtml = mapNodeToHtml(component);
  await fs.writeFile(path.join(outDir, `${name}.component.ts`), ejs.render(tsTemplate, { name, className: classNameStr }));
  await fs.writeFile(path.join(outDir, `${name}.component.html`), ejs.render(htmlTemplate, { name, mappedHtml }));
  await fs.writeFile(path.join(outDir, `${name}.component.scss`), ejs.render(scssTemplate, { name }));
  return [
    path.join(outDir, `${name}.component.ts`),
    path.join(outDir, `${name}.component.html`),
    path.join(outDir, `${name}.component.scss`)
  ];
}

const program = new Command();
program
  .option('--schema <path>', 'Path to canonical schema JSON')
  .parse(process.argv);

const options = program.opts();
if (!options.schema) {
  console.error('Error: --schema <path> is required');
  process.exit(1);
}

async function main() {
  const schemaPath = options.schema;
  const schemaRaw = await fs.readFile(schemaPath, 'utf-8');
  const schema = JSON.parse(schemaRaw);
  // Always output to figma-to-angular/src/app/generated/
  const outDir = path.join('figma-to-angular', 'src', 'app', 'generated', kebabCase(schema.name));
  const generatedFiles = await generateComponentFiles(schema, outDir);
  console.log('Generated files:', generatedFiles);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

export { generateComponentFiles, kebabCase, className };
