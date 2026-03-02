import { VASPParser } from '../../../src/parsers/VASPParser';

describe('VASPParser', () => {
  describe('INCAR parsing', () => {
    it('should parse basic INCAR parameters', () => {
      const content = 'ENCUT = 400\nPREC = Accurate';
      const parser = new VASPParser(content, 'INCAR');
      const result = parser.parseInput();

      expect(result.parameters).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should parse INCAR with boolean values', () => {
      const content = 'LCHARG = .TRUE.\nLWAVE = .FALSE.';
      const parser = new VASPParser(content, 'INCAR');
      const result = parser.parseInput();

      expect(result.parameters[0].value).toBe(true);
      expect(result.parameters[1].value).toBe(false);
    });

    it('should ignore comments in INCAR', () => {
      const content = 'ENCUT = 400\n! This is a comment\nPREC = Accurate';
      const parser = new VASPParser(content, 'INCAR');
      const result = parser.parseInput();

      expect(result.parameters).toHaveLength(2);
    });
  });

  describe('POSCAR parsing', () => {
    it('should parse POSCAR with comment line', () => {
      const content = `Si diamond structure
5.43
  0.500000   0.500000   0.000000
  0.000000   0.500000   0.500000
  0.500000   0.000000   0.500000
Si
  2
Direct
  0.000000   0.000000   0.000000
  0.250000   0.250000   0.250000`;

      const parser = new VASPParser(content, 'POSCAR');
      const result = parser.parseInput();

      // Should parse comment from first line
      expect(result.sections[0].name).toBe('POSCAR');
      expect(result.parameters).toHaveLength(3);
    });

    it('should parse POSCAR scaling factor', () => {
      const content = `Comment
1.0
1.0 0.0 0.0
0.0 1.0 0.0
0.0 0.0 1.0
H
1
Direct
0.0 0.0 0.0`;

      const parser = new VASPParser(content, 'POSCAR');
      const result = parser.parseInput();

      const scale = result.parameters.find(p => p.name === 'SCALE');
      expect(scale?.value).toBe(1.0);
    });

    it('should handle POSCAR with selective dynamics', () => {
      const content = `Comment
1.0
1.0 0.0 0.0
0.0 1.0 0.0
0.0 0.0 1.0
H
1
Selective Dynamics
Direct
0.0 0.0 0.0 T T T`;

      const parser = new VASPParser(content, 'POSCAR');
      const result = parser.parseInput();

      expect(result.sections[0].name).toBe('POSCAR');
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('KPOINTS parsing', () => {
    it('should parse KPOINTS with comment on first line', () => {
      const content = `K-Points
0
Gamma
4 4 4
0 0 0`;

      const parser = new VASPParser(content, 'KPOINTS');
      const result = parser.parseInput();

      expect(result.sections[0].name).toBe('KPOINTS');
      expect(result.errors).toHaveLength(0);
    });

    it('should parse KPOINTS grid dimensions', () => {
      const content = `K-Points
0
Gamma
4 4 4
0 0 0`;

      const parser = new VASPParser(content, 'KPOINTS');
      const result = parser.parseInput();

      const kx = result.parameters.find(p => p.name === 'KX');
      const ky = result.parameters.find(p => p.name === 'KY');
      const kz = result.parameters.find(p => p.name === 'KZ');

      expect(kx?.value).toBe(4);
      expect(ky?.value).toBe(4);
      expect(kz?.value).toBe(4);
    });
  });

  describe('Validation', () => {
    it('should validate INCAR with missing ENCUT', () => {
      const content = 'PREC = Accurate';
      const parser = new VASPParser(content, 'INCAR');
      const validation = parser.validate();

      expect(validation.valid).toBe(true);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });

    it('should detect invalid POSCAR format', () => {
      const content = 'Too short';
      const parser = new VASPParser(content, 'POSCAR');
      const result = parser.parseInput();

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
