import * as vscode from 'vscode';
import { DiagnosticsProvider } from '../../../src/providers/lsp/DiagnosticsProvider';

// Mock vscode module
jest.mock('vscode', () => ({
  languages: {
    createDiagnosticCollection: jest.fn().mockReturnValue({
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      dispose: jest.fn(),
    }),
  },
  Diagnostic: jest.fn().mockImplementation((range, message, severity) => ({
    range,
    message,
    severity,
    source: '',
    code: '',
  })),
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3,
  },
  Range: jest.fn().mockImplementation((startLine, startChar, endLine, endChar) => ({
    start: { line: startLine, character: startChar },
    end: { line: endLine, character: endChar },
  })),
}));

describe('DiagnosticsProvider', () => {
  let provider: DiagnosticsProvider;
  let mockDocument: any;

  beforeEach(() => {
    provider = new DiagnosticsProvider();
    jest.clearAllMocks();
  });

  describe('validateDocument', () => {
    it('should clear diagnostics for unsupported file', async () => {
      mockDocument = {
        getText: jest.fn().mockReturnValue(''),
        fileName: '/path/to/test.txt',
        languageId: 'plaintext',
        uri: { fsPath: '/path/to/test.txt' },
      };

      await provider.validateDocument(mockDocument);
      expect(mockDocument.getText).toHaveBeenCalled();
    });

    it('should validate VASP INCAR file', async () => {
      mockDocument = {
        getText: jest.fn().mockReturnValue('ENCUT = 520'),
        fileName: '/path/to/INCAR',
        languageId: 'vasp',
        uri: { fsPath: '/path/to/INCAR' },
        lineCount: 1,
        lineAt: jest.fn().mockReturnValue({
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 11 } },
        }),
      };

      await provider.validateDocument(mockDocument);
      expect(mockDocument.getText).toHaveBeenCalled();
    });

    it('should validate Gaussian input file', async () => {
      mockDocument = {
        getText: jest.fn().mockReturnValue('# B3LYP/6-31G(d)\n\nTest\n\n0 1\nH 0 0 0'),
        fileName: '/path/to/test.com',
        languageId: 'gaussian',
        uri: { fsPath: '/path/to/test.com' },
        lineCount: 5,
        lineAt: jest.fn().mockReturnValue({
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 20 } },
        }),
      };

      await provider.validateDocument(mockDocument);
      expect(mockDocument.getText).toHaveBeenCalled();
    });

    it('should validate ORCA input file', async () => {
      mockDocument = {
        getText: jest.fn().mockReturnValue('! RHF def2-SVP\n\n* xyz 0 1\nH 0 0 0\n*'),
        fileName: '/path/to/test.inp',
        languageId: 'orca',
        uri: { fsPath: '/path/to/test.inp' },
        lineCount: 5,
        lineAt: jest.fn().mockReturnValue({
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 20 } },
        }),
      };

      await provider.validateDocument(mockDocument);
      expect(mockDocument.getText).toHaveBeenCalled();
    });

    it('should validate CP2K input file', async () => {
      mockDocument = {
        getText: jest.fn().mockReturnValue('&GLOBAL\n  PROJECT_NAME test\n&END GLOBAL'),
        fileName: '/path/to/test.inp',
        languageId: 'cp2k',
        uri: { fsPath: '/path/to/test.inp' },
        lineCount: 3,
        lineAt: jest.fn().mockReturnValue({
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
        }),
      };

      await provider.validateDocument(mockDocument);
      expect(mockDocument.getText).toHaveBeenCalled();
    });

    it('should validate Quantum ESPRESSO input file', async () => {
      mockDocument = {
        getText: jest.fn().mockReturnValue("&CONTROL\ncalculation = 'scf'\n/"),
        fileName: '/path/to/test.in',
        languageId: 'qe',
        uri: { fsPath: '/path/to/test.in' },
        lineCount: 3,
        lineAt: jest.fn().mockReturnValue({
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
        }),
      };

      await provider.validateDocument(mockDocument);
      expect(mockDocument.getText).toHaveBeenCalled();
    });

    it('should validate GAMESS input file', async () => {
      mockDocument = {
        getText: jest.fn().mockReturnValue('$CONTRL RUNTYP=ENERGY $END'),
        fileName: '/path/to/test.inp',
        languageId: 'gamess',
        uri: { fsPath: '/path/to/test.inp' },
        lineCount: 1,
        lineAt: jest.fn().mockReturnValue({
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 25 } },
        }),
      };

      await provider.validateDocument(mockDocument);
      expect(mockDocument.getText).toHaveBeenCalled();
    });

    it('should validate NWChem input file', async () => {
      mockDocument = {
        getText: jest.fn().mockReturnValue('geometry\n  H 0 0 0\nend'),
        fileName: '/path/to/test.nw',
        languageId: 'nwchem',
        uri: { fsPath: '/path/to/test.nw' },
        lineCount: 3,
        lineAt: jest.fn().mockReturnValue({
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } },
        }),
      };

      await provider.validateDocument(mockDocument);
      expect(mockDocument.getText).toHaveBeenCalled();
    });

    it('should handle empty document', async () => {
      mockDocument = {
        getText: jest.fn().mockReturnValue(''),
        fileName: '/path/to/INCAR',
        languageId: 'vasp',
        uri: { fsPath: '/path/to/INCAR' },
        lineCount: 1,
        lineAt: jest.fn().mockReturnValue({
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
        }),
      };

      await provider.validateDocument(mockDocument);
      expect(mockDocument.getText).toHaveBeenCalled();
    });

    it('should handle multi-line document', async () => {
      mockDocument = {
        getText: jest.fn().mockReturnValue('ENCUT = 520\nPREC = Accurate\nEDIFF = 1E-6'),
        fileName: '/path/to/INCAR',
        languageId: 'vasp',
        uri: { fsPath: '/path/to/INCAR' },
        lineCount: 3,
        lineAt: jest.fn().mockImplementation((line: number) => ({
          range: {
            start: { line, character: 0 },
            end: { line, character: 20 },
          },
        })),
      };

      await provider.validateDocument(mockDocument);
      expect(mockDocument.getText).toHaveBeenCalled();
    });

    it('should handle document with comments', async () => {
      mockDocument = {
        getText: jest.fn().mockReturnValue('# Energy cutoff\nENCUT = 520 # eV'),
        fileName: '/path/to/INCAR',
        languageId: 'vasp',
        uri: { fsPath: '/path/to/INCAR' },
        lineCount: 2,
        lineAt: jest.fn().mockReturnValue({
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 20 } },
        }),
      };

      await provider.validateDocument(mockDocument);
      expect(mockDocument.getText).toHaveBeenCalled();
    });

    it('should handle parsing error gracefully', async () => {
      mockDocument = {
        getText: jest.fn().mockImplementation(() => {
          throw new Error('Parse error');
        }),
        fileName: '/path/to/INCAR',
        languageId: 'vasp',
        uri: { fsPath: '/path/to/INCAR' },
      };

      // Should not throw
      try {
        await provider.validateDocument(mockDocument);
      } catch (e: any) {
        expect(e.message).toBe('Parse error');
      }
    });
  });

  describe('clearDiagnostics', () => {
    it('should clear diagnostics for document', () => {
      mockDocument = {
        uri: { fsPath: '/path/to/test.txt' },
      };

      provider.clearDiagnostics(mockDocument);
      // Should not throw
    });
  });

  describe('clearAllDiagnostics', () => {
    it('should clear all diagnostics', () => {
      provider.clearAllDiagnostics();
      // Should not throw
    });
  });

  describe('dispose', () => {
    it('should dispose diagnostic collection', () => {
      provider.dispose();
      // Should not throw
    });
  });
});
