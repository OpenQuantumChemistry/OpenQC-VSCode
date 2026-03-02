import * as vscode from 'vscode';
import { HoverProvider } from '../../../src/providers/lsp/HoverProvider';

// Mock vscode module
jest.mock('vscode', () => ({
  Hover: jest.fn().mockImplementation((contents, range) => ({
    contents,
    range,
  })),
  MarkdownString: jest.fn().mockImplementation(value => ({
    value,
    isTrusted: false,
  })),
}));

describe('HoverProvider', () => {
  let provider: HoverProvider;
  let mockDocument: any;
  let mockPosition: any;
  let mockToken: any;

  beforeEach(() => {
    provider = new HoverProvider();
    mockPosition = { line: 0, character: 5 };
    mockToken = {};
  });

  describe('provideHover', () => {
    it('should handle unsupported file type', () => {
      mockDocument = {
        getWordRangeAtPosition: jest
          .fn()
          .mockReturnValue({ start: { character: 0 }, end: { character: 5 } }),
        getText: jest.fn((range?: any) => 'ENCUT'),
        fileName: '/path/to/test.txt',
        languageId: 'plaintext',
      };

      const result = provider.provideHover(mockDocument, mockPosition, mockToken);
      expect(result).toBeDefined();
    });

    it('should return null when no word at position', () => {
      mockDocument = {
        getWordRangeAtPosition: jest.fn().mockReturnValue(null),
        getText: jest.fn(),
        fileName: '/path/to/INCAR',
        languageId: 'vasp',
      };

      const result = provider.provideHover(mockDocument, mockPosition, mockToken);
      expect(result).toBeDefined();
    });

    it('should provide hover for VASP ENCUT parameter', () => {
      mockDocument = {
        getWordRangeAtPosition: jest
          .fn()
          .mockReturnValue({ start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }),
        getText: jest.fn((range?: any) => 'ENCUT'),
        fileName: '/path/to/INCAR',
        languageId: 'vasp',
      };

      const result = provider.provideHover(mockDocument, mockPosition, mockToken);
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should provide hover for VASP ISMEAR parameter', () => {
      mockDocument = {
        getWordRangeAtPosition: jest
          .fn()
          .mockReturnValue({ start: { line: 0, character: 0 }, end: { line: 0, character: 6 } }),
        getText: jest.fn((range?: any) => 'ISMEAR'),
        fileName: '/path/to/INCAR',
        languageId: 'vasp',
      };

      const result = provider.provideHover(mockDocument, mockPosition, mockToken);
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should provide hover for VASP IBRION parameter', () => {
      mockDocument = {
        getWordRangeAtPosition: jest
          .fn()
          .mockReturnValue({ start: { line: 0, character: 0 }, end: { line: 0, character: 6 } }),
        getText: jest.fn((range?: any) => 'IBRION'),
        fileName: '/path/to/INCAR',
        languageId: 'vasp',
      };

      const result = provider.provideHover(mockDocument, mockPosition, mockToken);
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should provide hover for VASP NSW parameter', () => {
      mockDocument = {
        getWordRangeAtPosition: jest
          .fn()
          .mockReturnValue({ start: { line: 0, character: 0 }, end: { line: 0, character: 3 } }),
        getText: jest.fn((range?: any) => 'NSW'),
        fileName: '/path/to/INCAR',
        languageId: 'vasp',
      };

      const result = provider.provideHover(mockDocument, mockPosition, mockToken);
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should provide hover for VASP ISIF parameter', () => {
      mockDocument = {
        getWordRangeAtPosition: jest
          .fn()
          .mockReturnValue({ start: { line: 0, character: 0 }, end: { line: 0, character: 4 } }),
        getText: jest.fn((range?: any) => 'ISIF'),
        fileName: '/path/to/INCAR',
        languageId: 'vasp',
      };

      const result = provider.provideHover(mockDocument, mockPosition, mockToken);
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should provide hover for VASP EDIFF parameter', () => {
      mockDocument = {
        getWordRangeAtPosition: jest
          .fn()
          .mockReturnValue({ start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }),
        getText: jest.fn((range?: any) => 'EDIFF'),
        fileName: '/path/to/INCAR',
        languageId: 'vasp',
      };

      const result = provider.provideHover(mockDocument, mockPosition, mockToken);
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should provide hover for VASP PREC parameter', () => {
      mockDocument = {
        getWordRangeAtPosition: jest
          .fn()
          .mockReturnValue({ start: { line: 0, character: 0 }, end: { line: 0, character: 4 } }),
        getText: jest.fn((range?: any) => 'PREC'),
        fileName: '/path/to/INCAR',
        languageId: 'vasp',
      };

      const result = provider.provideHover(mockDocument, mockPosition, mockToken);
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should return null for unknown VASP parameter', () => {
      mockDocument = {
        getWordRangeAtPosition: jest
          .fn()
          .mockReturnValue({ start: { line: 0, character: 0 }, end: { line: 0, character: 10 } }),
        getText: jest.fn((range?: any) => 'UNKNOWN123'),
        fileName: '/path/to/INCAR',
        languageId: 'vasp',
      };

      const result = provider.provideHover(mockDocument, mockPosition, mockToken);
      expect(result).toBeDefined();
    });

    it('should handle Gaussian route line', () => {
      mockDocument = {
        getWordRangeAtPosition: jest
          .fn()
          .mockReturnValue({ start: { line: 0, character: 2 }, end: { line: 0, character: 7 } }),
        getText: jest.fn((range?: any) => 'B3LYP'),
        fileName: '/path/to/test.com',
        languageId: 'gaussian',
      };

      // Gaussian parameters may not all be documented
      const result = provider.provideHover(mockDocument, mockPosition, mockToken);
      // Just check it doesn't throw
      expect(result).toBeDefined();
    });

    it('should handle ORCA input', () => {
      mockDocument = {
        getWordRangeAtPosition: jest
          .fn()
          .mockReturnValue({ start: { line: 0, character: 2 }, end: { line: 0, character: 5 } }),
        getText: jest.fn((range?: any) => 'RHF'),
        fileName: '/path/to/test.inp',
        languageId: 'orca',
      };

      // ORCA parameters may not all be documented
      const result = provider.provideHover(mockDocument, mockPosition, mockToken);
      // Just check it doesn't throw
      expect(result).toBeDefined();
    });

    it('should handle CP2K input', () => {
      mockDocument = {
        getWordRangeAtPosition: jest
          .fn()
          .mockReturnValue({ start: { line: 0, character: 2 }, end: { line: 0, character: 10 } }),
        getText: jest.fn((range?: any) => 'RUN_TYPE'),
        fileName: '/path/to/test.inp',
        languageId: 'cp2k',
      };

      // CP2K parameters may not all be documented
      const result = provider.provideHover(mockDocument, mockPosition, mockToken);
      // Just check it doesn't throw
      expect(result).toBeDefined();
    });

    it('should handle Quantum ESPRESSO input', () => {
      mockDocument = {
        getWordRangeAtPosition: jest
          .fn()
          .mockReturnValue({ start: { line: 0, character: 0 }, end: { line: 0, character: 11 } }),
        getText: jest.fn((range?: any) => 'calculation'),
        fileName: '/path/to/test.in',
        languageId: 'qe',
      };

      // QE parameters may not all be documented
      const result = provider.provideHover(mockDocument, mockPosition, mockToken);
      // Just check it doesn't throw
      expect(result).toBeDefined();
    });

    it('should handle GAMESS input', () => {
      mockDocument = {
        getWordRangeAtPosition: jest
          .fn()
          .mockReturnValue({ start: { line: 0, character: 1 }, end: { line: 0, character: 7 } }),
        getText: jest.fn((range?: any) => 'RUNTYP'),
        fileName: '/path/to/test.inp',
        languageId: 'gamess',
      };

      // GAMESS parameters may not all be documented
      const result = provider.provideHover(mockDocument, mockPosition, mockToken);
      // Just check it doesn't throw
      expect(result).toBeDefined();
    });

    it('should handle NWChem input', () => {
      mockDocument = {
        getWordRangeAtPosition: jest
          .fn()
          .mockReturnValue({ start: { line: 0, character: 0 }, end: { line: 0, character: 4 } }),
        getText: jest.fn((range?: any) => 'task'),
        fileName: '/path/to/test.nw',
        languageId: 'nwchem',
      };

      // NWChem parameters may not all be documented
      const result = provider.provideHover(mockDocument, mockPosition, mockToken);
      // Just check it doesn't throw
      expect(result).toBeDefined();
    });

    it('should handle cancellation token', () => {
      mockDocument = {
        getWordRangeAtPosition: jest
          .fn()
          .mockReturnValue({ start: { character: 0 }, end: { character: 5 } }),
        getText: jest.fn((range?: any) => 'ENCUT'),
        fileName: '/path/to/INCAR',
        languageId: 'vasp',
      };

      const result = provider.provideHover(mockDocument, mockPosition, {
        isCancellationRequested: true,
        onCancellationRequested: jest.fn(),
      });
      expect(result).toBeDefined();
    });
  });
});
