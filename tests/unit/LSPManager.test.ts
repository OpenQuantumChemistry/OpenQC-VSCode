import { LSPManager } from '../../src/managers/LSPManager';

// We need to declare mock functions outside and use jest.fn() inside the mock factory
// Using 'var' because jest.mock is hoisted and needs these to be accessible
var mockShowInfo: jest.Mock;
var mockShowWarning: jest.Mock;
var mockShowError: jest.Mock;
var mockExec: jest.Mock;
var mockLanguageClient: jest.Mock;

// Mock vscode module
jest.mock('vscode', () => {
  mockShowInfo = jest.fn();
  mockShowWarning = jest.fn();
  mockShowError = jest.fn();
  return {
    window: {
      showInformationMessage: mockShowInfo,
      showWarningMessage: mockShowWarning,
      showErrorMessage: mockShowError,
    },
    workspace: {
      getConfiguration: jest.fn(() => ({
        get: jest.fn((key: string, defaultValue?: any) => {
          if (key.includes('enabled')) return true;
          if (key.includes('path')) {
            const softwareMap: Record<string, string> = {
              cp2k: 'cp2k-lsp-enhanced',
              gaussian: 'gaussian-lsp',
              vasp: 'vasp-lsp',
              orca: 'orca-lsp',
              qe: 'qe-lsp',
              gamess: 'gamess-lsp',
              nwchem: 'nwchem-lsp',
            };
            for (const [sw, path] of Object.entries(softwareMap)) {
              if (key.includes(sw)) return path;
            }
          }
          return defaultValue;
        }),
      })),
      createFileSystemWatcher: jest.fn(() => ({
        onDidCreate: jest.fn(),
        onDidChange: jest.fn(),
        onDidDelete: jest.fn(),
        dispose: jest.fn(),
      })),
    },
  };
});

// Mock child_process
jest.mock('child_process', () => {
  mockExec = jest.fn((cmd: string, callback: Function) => {
    callback(null, { stdout: '/usr/bin/test' });
  });
  return { exec: mockExec };
});

// Mock util
jest.mock('util', () => ({ promisify: jest.fn((fn: Function) => fn) }));

// Mock vscode-languageclient/node
jest.mock('vscode-languageclient/node', () => {
  mockLanguageClient = jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    needsStop: jest.fn().mockReturnValue(true),
  }));
  return {
    LanguageClient: mockLanguageClient,
    TransportKind: { stdio: 0 },
  };
});

describe('LSPManager', () => {
  let lspManager: LSPManager;
  let mockDocument: any;

  beforeEach(() => {
    jest.clearAllMocks();
    lspManager = new LSPManager();
    mockDocument = {
      uri: { fsPath: '/test/file.com' },
      fileName: '/test/file.com',
      languageId: 'gaussian',
      getText: jest.fn().mockReturnValue('%chk=test.chk\n# B3LYP/6-31G(d)\n\n0 1\nH 0 0 0'),
    } as any;
    // Reset mock implementations
    mockExec.mockImplementation((cmd: string, callback: Function) => {
      callback(null, { stdout: '/usr/bin/test' });
    });
    mockLanguageClient.mockImplementation(() => ({
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      needsStop: jest.fn().mockReturnValue(true),
    }));
  });

  afterEach(() => {
    lspManager.dispose();
  });

  describe('startLSPForDocument', () => {
    it('should start LSP for a valid document', async () => {
      await lspManager.startLSPForDocument(mockDocument);
      expect(mockShowInfo).toHaveBeenCalledWith(expect.stringContaining('Language Server started'));
    });

    it('should not start LSP if software cannot be detected', async () => {
      const unknownDoc = {
        ...mockDocument,
        fileName: '/test/unknown.xyz',
        getText: jest.fn().mockReturnValue('unknown'),
      };
      await lspManager.startLSPForDocument(unknownDoc);
      expect(mockShowInfo).not.toHaveBeenCalled();
    });

    it('should not start LSP if already running', async () => {
      await lspManager.startLSPForDocument(mockDocument);
      await lspManager.startLSPForDocument(mockDocument);
      expect(mockLanguageClient).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when LSP executable is not found', async () => {
      mockExec.mockImplementationOnce((cmd: string, callback: Function) => {
        callback(new Error('command not found'), null);
      });
      await lspManager.startLSPForDocument(mockDocument);
      expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('Failed to start'));
    });

    it('should clean up client map on error', async () => {
      mockLanguageClient
        .mockImplementationOnce(() => ({
          start: jest.fn().mockRejectedValue(new Error('Start failed')),
          stop: jest.fn(),
          needsStop: jest.fn().mockReturnValue(false),
        }))
        .mockImplementation(() => ({
          start: jest.fn().mockResolvedValue(undefined),
          stop: jest.fn(),
          needsStop: jest.fn().mockReturnValue(true),
        }));
      await lspManager.startLSPForDocument(mockDocument);
      await lspManager.startLSPForDocument(mockDocument);
      expect(mockLanguageClient).toHaveBeenCalledTimes(2);
    });
  });

  describe('stopLSPForDocument', () => {
    it('should stop running LSP', async () => {
      const mockStop = jest.fn().mockResolvedValue(undefined);
      mockLanguageClient.mockImplementation(() => ({
        start: jest.fn().mockResolvedValue(undefined),
        stop: mockStop,
        needsStop: jest.fn().mockReturnValue(true),
      }));
      await lspManager.startLSPForDocument(mockDocument);
      await lspManager.stopLSPForDocument(mockDocument);
      expect(mockStop).toHaveBeenCalled();
    });

    it('should handle errors when stopping LSP', async () => {
      mockLanguageClient.mockImplementation(() => ({
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn().mockRejectedValue(new Error('Stop failed')),
        needsStop: jest.fn().mockReturnValue(true),
      }));
      await lspManager.startLSPForDocument(mockDocument);
      await lspManager.stopLSPForDocument(mockDocument);
      expect(mockShowWarning).toHaveBeenCalledWith(expect.stringContaining('Error stopping'));
    });

    it('should not call stop if client does not need stop', async () => {
      const mockStop = jest.fn();
      mockLanguageClient.mockImplementation(() => ({
        start: jest.fn().mockResolvedValue(undefined),
        stop: mockStop,
        needsStop: jest.fn().mockReturnValue(false),
      }));
      await lspManager.startLSPForDocument(mockDocument);
      await lspManager.stopLSPForDocument(mockDocument);
      expect(mockStop).not.toHaveBeenCalled();
    });

    it('should do nothing if software is not detected', async () => {
      const unknownDoc = {
        ...mockDocument,
        fileName: '/test/unknown.xyz',
        getText: jest.fn().mockReturnValue('unknown'),
      };
      await expect(lspManager.stopLSPForDocument(unknownDoc)).resolves.not.toThrow();
    });
  });

  describe('restartLSPForDocument', () => {
    it('should successfully restart LSP', async () => {
      const mockStart = jest.fn().mockResolvedValue(undefined);
      const mockStop = jest.fn().mockResolvedValue(undefined);
      mockLanguageClient.mockImplementation(() => ({
        start: mockStart,
        stop: mockStop,
        needsStop: jest.fn().mockReturnValue(true),
      }));
      await lspManager.restartLSPForDocument(mockDocument);
      expect(mockStop).toHaveBeenCalled();
      expect(mockStart).toHaveBeenCalled();
      expect(mockShowInfo).toHaveBeenCalledWith(expect.stringContaining('Language Server started'));
    });

    it('should show warning if software cannot be detected', async () => {
      const unknownDoc = {
        ...mockDocument,
        fileName: '/test/unknown.xyz',
        getText: jest.fn().mockReturnValue('unknown'),
      };
      await lspManager.restartLSPForDocument(unknownDoc);
      expect(mockShowWarning).toHaveBeenCalledWith(
        'Could not detect quantum chemistry software for this file'
      );
    });

    it('should show error if restart fails', async () => {
      mockLanguageClient.mockImplementation(() => ({
        start: jest.fn().mockRejectedValue(new Error('Restart failed')),
        stop: jest.fn(),
        needsStop: jest.fn().mockReturnValue(true),
      }));
      await lspManager.restartLSPForDocument(mockDocument);
      expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('Failed to restart'));
    });

    it('should wait between stop and start', async () => {
      mockLanguageClient.mockImplementation(() => ({
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn().mockResolvedValue(undefined),
        needsStop: jest.fn().mockReturnValue(true),
      }));
      const startTime = Date.now();
      await lspManager.restartLSPForDocument(mockDocument);
      expect(Date.now() - startTime).toBeGreaterThanOrEqual(500);
    });
  });

  describe('dispose', () => {
    it('should stop all clients on dispose', async () => {
      const mockStop = jest.fn().mockResolvedValue(undefined);
      mockLanguageClient.mockImplementation(() => ({
        start: jest.fn().mockResolvedValue(undefined),
        stop: mockStop,
        needsStop: jest.fn().mockReturnValue(true),
      }));
      const gaussianDoc = {
        ...mockDocument,
        fileName: '/test/file.com',
        getText: jest.fn().mockReturnValue('%chk=test\n# B3LYP'),
      };
      const vaspDoc = {
        ...mockDocument,
        fileName: '/test/INCAR',
        getText: jest.fn().mockReturnValue('ENCUT=520'),
      };
      await lspManager.startLSPForDocument(gaussianDoc);
      await lspManager.startLSPForDocument(vaspDoc);
      lspManager.dispose();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockStop).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during dispose', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockLanguageClient.mockImplementation(() => ({
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn().mockRejectedValue(new Error('Dispose failed')),
        needsStop: jest.fn().mockReturnValue(true),
      }));
      await lspManager.startLSPForDocument(mockDocument);
      lspManager.dispose();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error stopping'),
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('getLanguageId and getExtensions', () => {
    it('should map all software types correctly', async () => {
      const testCases = [
        { fileName: '/test/file.inp', content: '&GLOBAL' },
        { fileName: '/test/INCAR', content: 'ENCUT=520' },
        { fileName: '/test/file.com', content: '%chk=test\n# B3LYP' },
        { fileName: '/test/file.inp', content: '! HF' },
        { fileName: '/test/file.in', content: '&CONTROL' },
        { fileName: '/test/file.inp', content: '$BASIS' },
        { fileName: '/test/file.nw', content: 'geometry' },
      ];
      for (const tc of testCases) {
        const doc: any = {
          uri: { fsPath: tc.fileName },
          fileName: tc.fileName,
          getText: () => tc.content,
        };
        await lspManager.startLSPForDocument(doc);
      }
      expect(mockLanguageClient).toHaveBeenCalledTimes(7);
    });
  });
});
