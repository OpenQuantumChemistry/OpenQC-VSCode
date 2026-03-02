import { VASPParser } from '../../../src/parsers/VASPParser';

describe('VASPParser Coordinates', () => {
  describe('POSCAR coordinate extraction', () => {
    it('should extract Direct coordinates from POSCAR', () => {
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
      const coords = parser.getCoordinates();

      expect(coords).toHaveLength(2);
      expect(coords[0]).toEqual([0.0, 0.0, 0.0]);
      expect(coords[1]).toEqual([0.25, 0.25, 0.25]);
    });

    it('should extract Cartesian coordinates from POSCAR', () => {
      const content = `H2 molecule
1.0
  10.0   0.0   0.0
   0.0  10.0   0.0
   0.0   0.0  10.0
H
  2
Cartesian
   0.000000   0.000000   0.000000
   0.740000   0.000000   0.000000`;

      const parser = new VASPParser(content, 'POSCAR');
      const coords = parser.getCoordinates();

      expect(coords).toHaveLength(2);
      expect(coords[0]).toEqual([0.0, 0.0, 0.0]);
      expect(coords[1]).toEqual([0.74, 0.0, 0.0]);
    });

    it('should return empty array for INCAR file', () => {
      const content = 'ENCUT = 520\nPREC = Accurate';
      const parser = new VASPParser(content, 'INCAR');
      const coords = parser.getCoordinates();

      expect(coords).toEqual([]);
    });

    it('should handle POSCAR with multiple atom types', () => {
      const content = `BaTiO3
4.0
  1.0   0.0   0.0
  0.0   1.0   0.0
  0.0   0.0   1.0
Ba Ti O
  1  1  3
Direct
  0.000000   0.000000   0.000000
  0.500000   0.500000   0.500000
  0.500000   0.500000   0.000000
  0.500000   0.000000   0.500000
  0.000000   0.500000   0.500000`;

      const parser = new VASPParser(content, 'POSCAR');
      const coords = parser.getCoordinates();

      expect(coords).toHaveLength(5);
    });

    it('should parse selective dynamics flags if present', () => {
      const content = `Test
1.0
  1.0   0.0   0.0
  0.0   1.0   0.0
  0.0   0.0   1.0
H
  1
Selective Dynamics
Direct
  0.250000   0.250000   0.250000 T T F`;

      const parser = new VASPParser(content, 'POSCAR');
      const coords = parser.getCoordinates();

      expect(coords).toHaveLength(1);
      expect(coords[0]).toEqual([0.25, 0.25, 0.25]);
    });
  });

  describe('POSCAR lattice vectors', () => {
    it('should extract lattice vectors from POSCAR', () => {
      const content = `Si
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
      const lattice = parser.getLatticeVectors();

      expect(lattice).toHaveLength(3);
      expect(lattice[0]).toEqual([0.5, 0.5, 0.0]);
      expect(lattice[1]).toEqual([0.0, 0.5, 0.5]);
      expect(lattice[2]).toEqual([0.5, 0.0, 0.5]);
    });

    it('should return empty array for INCAR file', () => {
      const content = 'ENCUT = 520';
      const parser = new VASPParser(content, 'INCAR');
      const lattice = parser.getLatticeVectors();

      expect(lattice).toEqual([]);
    });
  });

  describe('POSCAR atom types and counts', () => {
    it('should extract atom types from POSCAR', () => {
      const content = `BaTiO3
4.0
  1.0   0.0   0.0
  0.0   1.0   0.0
  0.0   0.0   1.0
Ba Ti O
  1  1  3
Direct
  0.000000   0.000000   0.000000
  0.500000   0.500000   0.500000
  0.500000   0.500000   0.000000
  0.500000   0.000000   0.500000
  0.000000   0.500000   0.500000`;

      const parser = new VASPParser(content, 'POSCAR');
      const atomTypes = parser.getAtomTypes();

      expect(atomTypes).toEqual(['Ba', 'Ti', 'O']);
    });

    it('should extract atom counts from POSCAR', () => {
      const content = `BaTiO3
4.0
  1.0   0.0   0.0
  0.0   1.0   0.0
  0.0   0.0   1.0
Ba Ti O
  1  1  3
Direct
  0.000000   0.000000   0.000000
  0.500000   0.500000   0.500000
  0.500000   0.500000   0.000000
  0.500000   0.000000   0.500000
  0.000000   0.500000   0.500000`;

      const parser = new VASPParser(content, 'POSCAR');
      const atomCounts = parser.getAtomCounts();

      expect(atomCounts).toEqual([1, 1, 3]);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty POSCAR', () => {
      const parser = new VASPParser('', 'POSCAR');
      expect(parser.getCoordinates()).toEqual([]);
      expect(parser.getLatticeVectors()).toEqual([]);
      expect(parser.getAtomTypes()).toEqual([]);
      expect(parser.getAtomCounts()).toEqual([]);
    });

    it('should handle POSCAR with too few lines', () => {
      const content = `Test
1.0`;
      const parser = new VASPParser(content, 'POSCAR');
      expect(parser.getCoordinates()).toEqual([]);
      expect(parser.getLatticeVectors()).toEqual([]);
    });

    it('should handle KPOINTS file for coordinate methods', () => {
      const content = `K-Points
0
Gamma
4 4 4`;
      const parser = new VASPParser(content, 'KPOINTS');
      expect(parser.getCoordinates()).toEqual([]);
      expect(parser.getLatticeVectors()).toEqual([]);
      expect(parser.getAtomTypes()).toEqual([]);
      expect(parser.getAtomCounts()).toEqual([]);
    });

    it('should handle negative coordinates', () => {
      const content = `Test
1.0
  1.0   0.0   0.0
  0.0   1.0   0.0
  0.0   0.0   1.0
H
  1
Direct
 -0.500000  -0.250000   0.000000`;

      const parser = new VASPParser(content, 'POSCAR');
      const coords = parser.getCoordinates();

      expect(coords).toHaveLength(1);
      expect(coords[0]).toEqual([-0.5, -0.25, 0.0]);
    });
  });
});
