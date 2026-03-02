import { LSPManager } from '../../src/managers/LSPManager';

// Mock vscode module
jest.mock('vscode', () => {
  const mockShowInfo = jest.fn();
  const mockShowWarning = jest.fn();
  const mockShowError = jest.fn();

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
    _mockShowInfo: mockShowInfo,
    _mockShowWarning: mockShowWarning,
    _mockShowError: mockShowError,
  };
});

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

// Mock util - promisify should return a function that returns a Promise
jest.mock('util', () => ({
  promisify: jest.fn((fn: Function) => {
    return (...args: any[]) => {
      return new Promise((resolve, reject) => {
        fn(...args, (err: any, result: any) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    };
  }),
}));

// Mock vscode-languageclient/node
jest.mock('vscode-languageclient/node', () => {
  const mockLanguageClient = jest.fn();
  return {
    LanguageClient: mockLanguageClient,
    TransportKind: {
      stdio: 0,
    },
    _mockLanguageClient: mockLanguageClient,
  };
});

// Helper to get mock functions
const getMocks = () => {
  const vscode = require('vscode');
  const languageClient = require('vscode-languageclient/node');
  const childProcess = require('child_process');

  return {
    mockShowInfo: vscode._mockShowInfo,
    mockShowWarning: vscode._mockShowWarning,
    mockShowError: vscode._mockShowError,
    mockLanguageClient: languageClient._mockLanguageClient,
    mockExec: childProcess.exec,
  };
};

describe('LSPManager', () => {
  let lspManager: LSPManager;
  let mocks: any;

  beforeEach(() => {
    // IMPORTANT: Clear mocks but preserve implementations
    // jest.clearAllMocks() clears call history but keeps implementations
    jest.clearAllMocks();

    // Get mocks reference
    mocks = getMocks();

    // Set up default mock implementations that will persist
    // These need to be set up fresh before each test
    mocks.mockExec.mockImplementation((cmd: string, callback: Function) => {
      callback(null, { stdout: '/usr/bin/' + cmd.replace('which ', '') });
    });

    mocks.mockLanguageClient.mockImplementation(() => ({
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      needsStop: jest.fn().mockReturnValue(true),
    }));

    // Create LSPManager after mocks are set up
    lspManager = new LSPManager();
  });

  afterEach(() => {
    lspManager.dispose();
  });

  const createMockDocument = (overrides = {}) =>
    ({
      uri: { fsPath: '/test/file.com' },
      fileName: '/test/file.com',
      languageId: 'gaussian',
      isUntitled: false,
      encoding: 'utf8',
      version: 1,
      getText: jest.fn().mockReturnValue('%chk=test.chk\n# B3LYP/6-31G(d)\n\n0 1\nH 0 0 0'),
      lineCount: 5,
      lineAt: jest.fn(),
      offsetAt: jest.fn(),
      positionAt: jest.fn(),
      save: jest.fn(),
      eol: 1,
      ...overrides,
    }) as any;

  describe('startLSPForDocument', () => {
    it('should start LSP for a valid document', async () => {
      const mockDocument = createMockDocument();

      await lspManager.startLSPForDocument(mockDocument);

      expect(mocks.mockShowInfo).toHaveBeenCalledWith(
        expect.stringContaining('Language Server started')
      );
    });

    it('should not start LSP if software cannot be detected', async () => {
      const unknownDoc = createMockDocument({
        fileName: '/test/unknown.xyz',
        getText: jest.fn().mockReturnValue('unknown content'),
      });

      await lspManager.startLSPForDocument(unknownDoc);
      expect(mocks.mockShowInfo).not.toHaveBeenCalled();
    });

    it('should not start LSP if already running', async () => {
      const mockDocument = createMockDocument();

      await lspManager.startLSPForDocument(mockDocument);
      await lspManager.startLSPForDocument(mockDocument);

      expect(mocks.mockLanguageClient).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when LSP executable is not found', async () => {
      mocks.mockExec.mockImplementationOnce((cmd: string, callback: Function) => {
        callback(new Error('command not found'), null);
      });

      const mockDocument = createMockDocument();

      await lspManager.startLSPForDocument(mockDocument);

      expect(mocks.mockShowError).toHaveBeenCalledWith(expect.stringContaining('Failed to start'));
    });

    it('should clean up client map on error', async () => {
      mocks.mockLanguageClient
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

      const mockDocument = createMockDocument();

      await lspManager.startLSPForDocument(mockDocument);
      await lspManager.startLSPForDocument(mockDocument);

      expect(mocks.mockLanguageClient).toHaveBeenCalledTimes(2);
    });
  });

  describe('stopLSPForDocument', () => {
    it('should stop running LSP', async () => {
      const mockStop = jest.fn().mockResolvedValue(undefined);

      mocks.mockLanguageClient.mockImplementation(() => ({
        start: jest.fn().mockResolvedValue(undefined),
        stop: mockStop,
        needsStop: jest.fn().mockReturnValue(true),
      }));

      const mockDocument = createMockDocument();

      await lspManager.startLSPForDocument(mockDocument);
      await lspManager.stopLSPForDocument(mockDocument);

      expect(mockStop).toHaveBeenCalled();
    });

    it('should handle errors when stopping LSP', async () => {
      mocks.mockLanguageClient.mockImplementation(() => ({
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn().mockRejectedValue(new Error('Stop failed')),
        needsStop: jest.fn().mockReturnValue(true),
      }));

      const mockDocument = createMockDocument();

      await lspManager.startLSPForDocument(mockDocument);
      await lspManager.stopLSPForDocument(mockDocument);

      expect(mocks.mockShowWarning).toHaveBeenCalledWith(expect.stringContaining('Error stopping'));
    });

    it('should not call stop if client does not need stop', async () => {
      const mockStop = jest.fn();

      mocks.mockLanguageClient.mockImplementation(() => ({
        start: jest.fn().mockResolvedValue(undefined),
        stop: mockStop,
        needsStop: jest.fn().mockReturnValue(false),
      }));

      const mockDocument = createMockDocument();

      await lspManager.startLSPForDocument(mockDocument);
      await lspManager.stopLSPForDocument(mockDocument);

      expect(mockStop).not.toHaveBeenCalled();
    });

    it('should do nothing if software is not detected', async () => {
      const unknownDoc = createMockDocument({
        fileName: '/test/unknown.xyz',
        getText: jest.fn().mockReturnValue('unknown'),
      });

      await expect(lspManager.stopLSPForDocument(unknownDoc)).resolves.not.toThrow();
    });
  });

  describe('restartLSPForDocument', () => {
    it('should successfully restart LSP', async () => {
      const mockStart = jest.fn().mockResolvedValue(undefined);
      const mockStop = jest.fn().mockResolvedValue(undefined);

      mocks.mockLanguageClient.mockImplementation(() => ({
        start: mockStart,
        stop: mockStop,
        needsStop: jest.fn().mockReturnValue(true),
      }));

      const mockDocument = createMockDocument();

      // First start the LSP, then restart
      await lspManager.startLSPForDocument(mockDocument);
      await lspManager.restartLSPForDocument(mockDocument);

      expect(mockStop).toHaveBeenCalled();
      expect(mockStart).toHaveBeenCalledTimes(2); // Once for initial start, once for restart
      expect(mocks.mockShowInfo).toHaveBeenCalledWith(
        expect.stringContaining('Language Server started')
      );
    });

    it('should show warning if software cannot be detected', async () => {
      const unknownDoc = createMockDocument({
        fileName: '/test/unknown.xyz',
        getText: jest.fn().mockReturnValue('unknown'),
      });

      await lspManager.restartLSPForDocument(unknownDoc);

      expect(mocks.mockShowWarning).toHaveBeenCalledWith(
        'Could not detect quantum chemistry software for this file'
      );
    });

    it('should show error if restart fails', async () => {
      mocks.mockLanguageClient.mockImplementation(() => ({
        start: jest.fn().mockRejectedValue(new Error('Restart failed')),
        stop: jest.fn(),
        needsStop: jest.fn().mockReturnValue(true),
      }));

      const mockDocument = createMockDocument();

      await lspManager.restartLSPForDocument(mockDocument);

      // Restart calls stop then start, so we expect the start error message
      expect(mocks.mockShowError).toHaveBeenCalledWith(expect.stringContaining('Failed to start'));
    });

    it('should wait between stop and start', async () => {
      mocks.mockLanguageClient.mockImplementation(() => ({
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn().mockResolvedValue(undefined),
        needsStop: jest.fn().mockReturnValue(true),
      }));

      const mockDocument = createMockDocument();

      const startTime = Date.now();
      await lspManager.restartLSPForDocument(mockDocument);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(500);
    });
  });

  describe('dispose', () => {
    it('should stop all clients on dispose', async () => {
      const mockStop = jest.fn().mockResolvedValue(undefined);

      mocks.mockLanguageClient.mockImplementation(() => ({
        start: jest.fn().mockResolvedValue(undefined),
        stop: mockStop,
        needsStop: jest.fn().mockReturnValue(true),
      }));

      const gaussianDoc = createMockDocument({
        fileName: '/test/file.com',
        getText: jest.fn().mockReturnValue('%chk=test\n# B3LYP'),
      });
      const vaspDoc = createMockDocument({
        fileName: '/test/INCAR',
        getText: jest.fn().mockReturnValue('ENCUT=520'),
      });

      await lspManager.startLSPForDocument(gaussianDoc);
      await lspManager.startLSPForDocument(vaspDoc);

      lspManager.dispose();

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockStop).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during dispose', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mocks.mockLanguageClient.mockImplementation(() => ({
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn().mockRejectedValue(new Error('Dispose failed')),
        needsStop: jest.fn().mockReturnValue(true),
      }));

      const mockDocument = createMockDocument();

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
});
