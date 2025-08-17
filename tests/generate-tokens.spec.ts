// tests/generate-tokens.spec.ts
import { extractTokens, scssContent, cssContent } from '../tools/generate-tokens';

describe('Token Generator', () => {
  const schema = {
    style: { tokens: { color: 'primary-500', spacing: 's-2' } },
    children: [
      { style: { tokens: { color: 'secondary-400', spacing: 's-4' } }, children: [] },
      { style: { tokens: { color: 'primary-500', spacing: 's-2' } }, children: [] }
    ]
  };

  it('should extract unique color and spacing tokens', () => {
    const tokens = extractTokens(schema);
    expect(tokens.colorTokens.sort()).toEqual(['primary-500', 'secondary-400'].sort());
    expect(tokens.spacingTokens.sort()).toEqual(['s-2', 's-4'].sort());
  });

  it('should generate correct SCSS content', () => {
    const tokens = extractTokens(schema);
    const scss = scssContent(tokens);
    expect(scss).toContain('$color-primary-500: #000000;');
    expect(scss).toContain('$color-secondary-400: #000000;');
    expect(scss).toContain('$spacing-s-2: 8px;');
    expect(scss).toContain('$spacing-s-4: 8px;');
  });

  it('should generate correct CSS content', () => {
    const tokens = extractTokens(schema);
    const css = cssContent(tokens);
    expect(css).toContain('--color-primary-500: #000000;');
    expect(css).toContain('--color-secondary-400: #000000;');
    expect(css).toContain('--spacing-s-2: 8px;');
    expect(css).toContain('--spacing-s-4: 8px;');
  });
});

