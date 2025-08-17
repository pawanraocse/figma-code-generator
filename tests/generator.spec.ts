// tests/generator.spec.ts
import { generateComponentFiles, kebabCase, className } from '../tools/generator';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Angular Code Generator', () => {
  it('should normalize names to kebab-case', () => {
    expect(kebabCase('HeaderComponent')).toBe('header-component');
    expect(kebabCase('Main Page')).toBe('main-page');
  });

  it('should generate correct class names', () => {
    expect(className('header-component')).toBe('HeaderComponentComponent');
    expect(className('main-page')).toBe('MainPageComponent');
  });

  it('should generate component files', async () => {
    const component = { name: 'TestComponent', type: 'COMPONENT' };
    const outDir = path.resolve('src/app/generated/test-component-spec');
    const files = await generateComponentFiles(component, outDir);
    expect(files.length).toBe(3);
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      if (file.endsWith('.component.ts')) {
        expect(content).toContain('TestComponent');
      } else {
        expect(content).toContain('test-component');
      }
    }
  });
});
