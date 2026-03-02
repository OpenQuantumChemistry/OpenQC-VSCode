import * as vscode from 'vscode';
import { CompletionProvider } from '../../../src/providers/lsp/CompletionProvider';

// Mock vscode module
jest.mock('vscode', () => ({
  CompletionItem: jest.fn().mockImplementation((label, kind) => ({
    label,
    kind,
    detail: '',
    documentation: '',
    insertText: undefined,
  })),
  CompletionItemKind: {
    Property: 1,
    Method: 2,
    Keyword: 3,
    Struct: 4,
  },
  SnippetString: jest.fn().mockImplementation(value => ({
    value,
  })),
  Position: jest.fn(),
  CancellationToken: {},
}));

describe('CompletionProvider', () => {
  let provider: CompletionProvider;
  let mockDocument: any;
  let mockPosition: any;
  let mockToken: any;

  beforeEach(() => {
    provider = new CompletionProvider();
    mockPosition = { line: 0, character: 10 };
    mockToken = {};
  });

  describe('provideCompletionItems', () => {
    it('should return empty array for unsupported file', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: '' }),
        getText: jest.fn().mockReturnValue(''),
        fileName: 'test.txt',
        languageId: 'plaintext',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        mockToken,
        {} as any
      );

      expect(result).toEqual([]);
    });

    it('should provide VASP completions for INCAR file', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: 'ENC' }),
        getText: jest.fn().mockReturnValue('ENCUT = 520'),
        fileName: 'INCAR',
        languageId: 'vasp',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        mockToken,
        {} as any
      ) as any[];

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should provide Gaussian method completions', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: '# ' }),
        getText: jest.fn().mockReturnValue('# B3LYP/6-31G(d)'),
        fileName: 'test.com',
        languageId: 'gaussian',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        mockToken,
        {} as any
      ) as any[];

      expect(Array.isArray(result)).toBe(true);
      const labels = result.map((item: any) => item.label);
      expect(labels).toContain('B3LYP');
      expect(labels).toContain('HF');
      expect(labels).toContain('opt');
      expect(labels).toContain('freq');
    });

    it('should provide ORCA method completions', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: '!' }),
        getText: jest.fn().mockReturnValue('! RHF def2-SVP'),
        fileName: 'test.inp',
        languageId: 'orca',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        mockToken,
        {} as any
      ) as any[];

      expect(Array.isArray(result)).toBe(true);
      const labels = result.map((item: any) => item.label);
      expect(labels).toContain('RHF');
      expect(labels).toContain('DFT');
      expect(labels).toContain('def2-SVP');
    });

    it('should provide CP2K section completions when line starts with &', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: '&GLO' }),
        getText: jest.fn().mockReturnValue('&GLOBAL\n  PROJECT_NAME test\n&END GLOBAL'),
        fileName: 'test.inp',
        languageId: 'cp2k',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        mockToken,
        {} as any
      ) as any[];

      expect(Array.isArray(result)).toBe(true);
      const labels = result.map((item: any) => item.label);
      expect(labels).toContain('GLOBAL');
      expect(labels).toContain('FORCE_EVAL');
      expect(labels).toContain('DFT');
    });

    it('should provide CP2K parameter completions inside sections', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: 'PRO' }),
        getText: jest.fn().mockReturnValue('&GLOBAL\n  PRO\n&END GLOBAL'),
        fileName: 'test.inp',
        languageId: 'cp2k',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        mockToken,
        {} as any
      ) as any[];

      expect(Array.isArray(result)).toBe(true);
      const labels = result.map((item: any) => item.label);
      expect(labels).toContain('PROJECT_NAME');
      expect(labels).toContain('RUN_TYPE');
    });

    it('should provide Quantum ESPRESSO completions', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: 'calc' }),
        getText: jest.fn().mockReturnValue("&CONTROL\ncalculation = 'scf'\n/"),
        fileName: 'test.in',
        languageId: 'qe',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        mockToken,
        {} as any
      ) as any[];

      expect(Array.isArray(result)).toBe(true);
      const labels = result.map((item: any) => item.label);
      expect(labels).toContain('calculation');
      expect(labels).toContain('ecutwfc');
      expect(labels).toContain('ibrav');
    });

    it('should provide GAMESS completions', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: '$CON' }),
        getText: jest.fn().mockReturnValue('$CONTRL\n RUNTYP=ENERGY\n$END'),
        fileName: 'test.inp',
        languageId: 'gamess',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        mockToken,
        {} as any
      ) as any[];

      expect(Array.isArray(result)).toBe(true);
      const labels = result.map((item: any) => item.label);
      expect(labels).toContain('RUNTYP');
      expect(labels).toContain('SCFTYP');
      expect(labels).toContain('MAXIT');
    });

    it('should provide NWChem completions', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: 'geo' }),
        getText: jest.fn().mockReturnValue('geometry\n  C 0.0 0.0 0.0\nend'),
        fileName: 'test.nw',
        languageId: 'nwchem',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        mockToken,
        {} as any
      ) as any[];

      expect(Array.isArray(result)).toBe(true);
      const labels = result.map((item: any) => item.label);
      expect(labels).toContain('geometry');
      expect(labels).toContain('basis');
      expect(labels).toContain('task');
    });

    it('should handle empty line', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: '' }),
        getText: jest.fn().mockReturnValue(''),
        fileName: 'INCAR',
        languageId: 'vasp',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        mockToken,
        {} as any
      ) as any[];

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle line with special characters', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: 'ENCUT # comment' }),
        getText: jest.fn().mockReturnValue('ENCUT = 520 # energy cutoff'),
        fileName: 'INCAR',
        languageId: 'vasp',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        mockToken,
        {} as any
      ) as any[];

      expect(Array.isArray(result)).toBe(true);
    });

    it('should provide VASP ENCUT completion with snippet', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: '' }),
        getText: jest.fn().mockReturnValue(''),
        fileName: 'INCAR',
        languageId: 'vasp',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        mockToken,
        {} as any
      ) as any[];

      const encutItem = result.find((item: any) => item.label === 'ENCUT');
      expect(encutItem).toBeDefined();
      expect(encutItem?.detail).toBe('Energy cutoff (eV)');
    });

    it('should provide all VASP standard parameters', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: '' }),
        getText: jest.fn().mockReturnValue(''),
        fileName: 'INCAR',
        languageId: 'vasp',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        mockToken,
        {} as any
      ) as any[];

      const labels = result.map((item: any) => item.label);
      const expectedParams = [
        'ENCUT',
        'PREC',
        'EDIFF',
        'NELM',
        'ISMEAR',
        'SIGMA',
        'IBRION',
        'NSW',
        'ISIF',
        'ISPIN',
        'MAGMOM',
        'LREAL',
        'ALGO',
        'LWAVE',
        'LCHARG',
      ];

      expectedParams.forEach(param => {
        expect(labels).toContain(param);
      });
    });

    it('should provide Gaussian basis set completions', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: '# B3LYP/' }),
        getText: jest.fn().mockReturnValue('# B3LYP/'),
        fileName: 'test.com',
        languageId: 'gaussian',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        mockToken,
        {} as any
      ) as any[];

      expect(Array.isArray(result)).toBe(true);
      const labels = result.map((item: any) => item.label);
      expect(labels).toContain('6-31G(d)');
      expect(labels).toContain('6-311G(d,p)');
      expect(labels).toContain('def2-TZVP');
    });

    it('should provide ORCA basis set completions', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: '!' }),
        getText: jest.fn().mockReturnValue('! RHF'),
        fileName: 'test.inp',
        languageId: 'orca',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        mockToken,
        {} as any
      ) as any[];

      expect(Array.isArray(result)).toBe(true);
      const labels = result.map((item: any) => item.label);
      expect(labels).toContain('def2-SVP');
      expect(labels).toContain('def2-TZVP');
      expect(labels).toContain('def2-TZVPP');
    });

    it('should provide QE parameter completions with snippets', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: '' }),
        getText: jest.fn().mockReturnValue('&CONTROL\n'),
        fileName: 'test.in',
        languageId: 'qe',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        mockToken,
        {} as any
      ) as any[];

      const calculationItem = result.find((item: any) => item.label === 'calculation');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle VASP POSCAR file', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: 'Test' }),
        getText: jest.fn().mockReturnValue('Test structure'),
        fileName: 'POSCAR',
        languageId: 'vasp',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        mockToken,
        {} as any
      );

      // POSCAR doesn't use key-value pairs, so should return empty or minimal
      expect(result).toBeDefined();
    });

    it('should handle cancellation token', () => {
      mockDocument = {
        lineAt: jest.fn().mockReturnValue({ text: '' }),
        getText: jest.fn().mockReturnValue(''),
        fileName: 'INCAR',
        languageId: 'vasp',
      };

      const result = provider.provideCompletionItems(
        mockDocument,
        mockPosition,
        { isCancellationRequested: true, onCancellationRequested: jest.fn() } as any,
        {} as any
      );

      expect(result).toBeDefined();
    });
  });
});
