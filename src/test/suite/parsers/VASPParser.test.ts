import * as assert from 'assert';
import { VASPParser } from '../../../parsers/VASPParser';

suite('VASPParser Tests', () => {
  test('should parse INCAR file', () => {
    const content = `
ENCUT = 400
PREC = Accurate
EDIFF = 1E-6
ISMEAR = 0
SIGMA = 0.1
IBRION = 2
NSW = 100
ISIF = 2
`;
    const parser = new VASPParser(content, 'INCAR');
    const result = parser.parseInput();

    assert.strictEqual(result.parameters.length, 8);
    assert.strictEqual(result.errors.length, 0);

    const encut = parser.getParameter('ENCUT');
    assert.ok(encut);
    assert.strictEqual(encut?.value, 400);
  });

  test('should parse POSCAR file', () => {
    const content = `Comment line
1.0
2.5 0.0 0.0
0.0 2.5 0.0
0.0 0.0 2.5
H O
2 1
direct
0.0 0.0 0.0
0.5 0.5 0.5
0.25 0.25 0.25`;

    const parser = new VASPParser(content, 'POSCAR');
    const result = parser.parseInput();

    assert.ok(result.parameters.length > 0);
    assert.strictEqual(result.errors.length, 0);
  });

  test('should parse KPOINTS file', () => {
    const content = `Automatic mesh
0
Gamma
5 5 5
0 0 0`;

    const parser = new VASPParser(content, 'KPOINTS');
    const result = parser.parseInput();

    assert.ok(result.parameters.length >= 3);
    assert.strictEqual(result.errors.length, 0);
  });

  test('should validate INCAR with missing recommended parameters', () => {
    const content = `
ENCUT = 400
`;
    const parser = new VASPParser(content, 'INCAR');
    const validation = parser.validate();

    assert.strictEqual(validation.valid, true);
    assert.ok(validation.warnings.some((w: any) => w.message.includes('PREC')));
  });

  test('should convert boolean values', () => {
    const content = `
LCHARG = .TRUE.
LWAVE = .FALSE.
`;
    const parser = new VASPParser(content, 'INCAR');
    const result = parser.parseInput();

    const lcharg = parser.getParameter('LCHARG');
    const lwave = parser.getParameter('LWAVE');

    assert.strictEqual(lcharg?.value, true);
    assert.strictEqual(lwave?.value, false);
  });

  test('should get section by name', () => {
    const content = `
ENCUT = 400
PREC = Accurate
`;
    const parser = new VASPParser(content, 'INCAR');
    const section = parser.getSection('INCAR');

    assert.ok(section);
    assert.strictEqual(section?.name, 'INCAR');
    assert.strictEqual(section?.parameters.length, 2);
  });
});
