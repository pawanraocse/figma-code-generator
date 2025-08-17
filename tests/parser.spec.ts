// tests/parser.spec.ts
import { kebabCase, validateSchema } from '../tools/parser';

describe('Parser Canonical Schema', () => {
  it('should normalize names to kebab-case', () => {
    expect(kebabCase('HeaderComponent')).toBe('header-component');
    expect(kebabCase('Main Page')).toBe('main-page');
  });

  it('should validate correct canonical schema', () => {
    const valid = {
      id: 'id',
      name: 'header',
      type: 'FRAME',
      layerType: 'frame',
      props: { x: 0, y: 0, w: 0, h: 0, metadata: {} },
      children: [],
      style: {
        fills: [], strokes: [], font: { family: '', size: 0, weight: '' }, spacing: { padding: 0, margin: 0 }, tokens: { color: 'primary-500', spacing: 's-2' }
      },
      tokensUsed: ['primary-500', 's-2']
    };
    expect(validateSchema(valid)).toBe(true);
  });

  it('should fail validation for missing fields', () => {
    const invalid = {
      id: 'id',
      name: 'header',
      type: 'FRAME',
      layerType: 'frame',
      props: {},
      children: [],
      style: {},
      // tokensUsed missing
    };
    expect(validateSchema(invalid)).toBe(false);
  });
});

