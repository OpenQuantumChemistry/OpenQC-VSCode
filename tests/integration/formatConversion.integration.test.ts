/**
 * Format Conversion Integration Tests
 *
 * Integration tests for the format conversion functionality.
 * These tests require the Python backend to be available.
 */

import * as path from 'path';
import * as fs from 'fs';
import { FormatConverter, SupportedFormat } from '../../src/converters';

describe('Format Conversion Integration Tests', () => {
  let converter: FormatConverter;
  const fixturesDir = path.join(__dirname, '../fixtures/format_conversion');
  const outputDir = path.join(__dirname, '../temp/format_conversion');

  beforeAll(async () => {
    converter = new FormatConverter();

    // Check if backend is available
    const backendAvailable = await converter.checkBackend();
    if (!backendAvailable) {
      console.warn('Python backend not available. Skipping integration tests.');
      return;
    }

    // Create output directory
    fs.mkdirSync(outputDir, { recursive: true });
  });

  afterAll(() => {
    converter.dispose();

    // Clean up output directory
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
  });

  const getBackendAvailable = async () => {
    return await converter.checkBackend();
  };

  describe('VASP Format Conversion', () => {
    it('should convert VASP POSCAR to XYZ', async () => {
      if (!(await getBackendAvailable())) return;

      const inputFile = path.join(fixturesDir, 'POSCAR');
      const outputFile = path.join(outputDir, 'silicon.xyz');

      const result = await converter.convert(inputFile, outputFile);

      expect(result.success).toBe(true);
      expect(result.input_format).toContain('vasp');
      expect(result.output_format).toBe('xyz');
      expect(fs.existsSync(outputFile)).toBe(true);

      // Verify output file content
      const content = fs.readFileSync(outputFile, 'utf-8');
      const lines = content.split('\n');
      expect(parseInt(lines[0])).toBe(2); // 2 atoms
    });

    it('should convert VASP POSCAR to PDB', async () => {
      if (!(await getBackendAvailable())) return;

      const inputFile = path.join(fixturesDir, 'POSCAR');
      const outputFile = path.join(outputDir, 'silicon.pdb');

      const result = await converter.convert(inputFile, outputFile);

      expect(result.success).toBe(true);
      expect(result.output_format).toBe('pdb');
      expect(fs.existsSync(outputFile)).toBe(true);
    });
  });

  describe('XYZ Format Conversion', () => {
    it('should convert XYZ to VASP POSCAR', async () => {
      if (!(await getBackendAvailable())) return;

      const inputFile = path.join(fixturesDir, 'sample.xyz');
      const outputFile = path.join(outputDir, 'water.POSCAR');

      const result = await converter.convert(inputFile, outputFile);

      expect(result.success).toBe(true);
      expect(result.input_format).toBe('xyz');
      expect(result.output_format).toContain('vasp');
      expect(fs.existsSync(outputFile)).toBe(true);
    });

    it('should preserve metadata during XYZ conversion', async () => {
      if (!(await getBackendAvailable())) return;

      const inputFile = path.join(fixturesDir, 'sample.xyz');
      const outputFile = path.join(outputDir, 'water-meta.xyz');

      const result = await converter.convert(inputFile, outputFile);

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.atoms_count).toBe(3);
    });
  });

  describe('Gaussian Format Conversion', () => {
    it('should convert Gaussian to XYZ', async () => {
      if (!(await getBackendAvailable())) return;

      const inputFile = path.join(fixturesDir, 'gaussian.gjf');
      const outputFile = path.join(outputDir, 'gaussian-mol.xyz');

      const result = await converter.convert(inputFile, outputFile);

      expect(result.success).toBe(true);
      expect(result.output_format).toBe('xyz');
    });

    it('should convert Gaussian to VASP', async () => {
      if (!(await getBackendAvailable())) return;

      const inputFile = path.join(fixturesDir, 'gaussian.gjf');
      const outputFile = path.join(outputDir, 'gaussian-to-vasp.POSCAR');

      const result = await converter.convert(inputFile, outputFile);

      expect(result.success).toBe(true);
    });
  });

  describe('Format Detection', () => {
    it('should correctly detect VASP POSCAR format', () => {
      const detection = FormatConverter.detectFormat('/path/to/POSCAR');
      expect(detection.format).toBe(SupportedFormat.POSCAR);
      expect(detection.confidence).toBe(1.0);
    });

    it('should correctly detect XYZ format', () => {
      const detection = FormatConverter.detectFormat('/path/to/molecule.xyz');
      expect(detection.format).toBe(SupportedFormat.XYZ);
      expect(detection.confidence).toBe(0.9);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent input file', async () => {
      if (!(await getBackendAvailable())) return;

      const result = await converter.convert('/nonexistent/file.xyz', '/output/test.xyz');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle invalid format conversion', async () => {
      if (!(await getBackendAvailable())) return;

      const result = await converter.convert('/path/to/file.txt', '/output/test.xyz');

      // Should not crash even with unsupported input
      expect(result).toBeDefined();
    });
  });

  describe('Batch Conversion', () => {
    it('should convert multiple XYZ files to VASP', async () => {
      if (!(await getBackendAvailable())) return;

      const inputFiles = [path.join(fixturesDir, 'sample.xyz')];
      const batchOutputDir = path.join(outputDir, 'batch');

      const result = await converter.batchConvert(
        inputFiles,
        batchOutputDir,
        SupportedFormat.POSCAR
      );

      expect(result.total).toBe(1);
      expect(result.successful).toBeGreaterThan(0);
    });
  });

  describe('XYZ Utility Function', () => {
    it('should convert atoms array to XYZ format', () => {
      const atoms = [
        { elem: 'C', x: 0, y: 0, z: 0 },
        { elem: 'H', x: 1.089, y: 0, z: 0 },
        { elem: 'H', x: -0.5445, y: 0.9432, z: 0 },
      ];

      const xyz = FormatConverter.convertToXYZ(atoms, 'Methane');

      expect(xyz).toContain('3');
      expect(xyz).toContain('Methane');
      expect(xyz).toContain('C');
      expect(xyz).toContain('H');
    });
  });
});
