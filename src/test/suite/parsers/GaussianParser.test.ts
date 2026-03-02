import * as assert from 'assert';
import { GaussianParser } from '../../../parsers/GaussianParser';

suite('GaussianParser Tests', () => {
  test('should parse basic Gaussian input', () => {
    const content = `
%chk=water.chk
# B3LYP/6-31G(d) opt

Water optimization

0 1
O 0.0 0.0 0.0
H 0.96 0.0 0.0
H -0.24 0.93 0.0
`;
    const parser = new GaussianParser(content);
    const result = parser.parseInput();

    assert.ok(result.parameters.length > 0);

    const method = parser.getParameter('Method');
    assert.ok(method);
    assert.strictEqual(method?.value, 'B3LYP');

    const basis = parser.getParameter('Basis');
    assert.ok(basis);
    assert.strictEqual(basis?.value, '6-31G(d)');
  });

  test('should parse Link0 section', () => {
    const content = `
%chk=test.chk
%mem=1GB
%nprocshared=4
# HF/STO-3G

Test

0 1
H 0 0 0
`;
    const parser = new GaussianParser(content);
    const result = parser.parseInput();

    const chk = parser.getParameter('chk');
    assert.ok(chk);
    assert.strictEqual(chk?.value, 'test.chk');
  });

  test('should validate with missing route section', () => {
    const content = `
%chk=test.chk

Test

0 1
H 0 0 0
`;
    const parser = new GaussianParser(content);
    const validation = parser.validate();

    assert.strictEqual(validation.valid, false);
    assert.ok(validation.errors.some(e => e.message.includes('route')));
  });

  test('should validate with missing charge section', () => {
    const content = `
# HF/STO-3G

Test

H 0 0 0
`;
    const parser = new GaussianParser(content);
    const validation = parser.validate();

    assert.strictEqual(validation.valid, false);
    assert.ok(validation.errors.some(e => e.message.includes('charge')));
  });

  test('should parse charge and multiplicity', () => {
    const content = `
# HF/STO-3G

Test

1 2
H 0 0 0
`;
    const parser = new GaussianParser(content);
    const result = parser.parseInput();

    const charge = parser.getParameter('Charge');
    const multiplicity = parser.getParameter('Multiplicity');

    assert.strictEqual(charge?.value, 1);
    assert.strictEqual(multiplicity?.value, 2);
  });
});
