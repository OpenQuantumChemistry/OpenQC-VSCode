import { jest } from '@jest/globals';

// Mock vscode module before importing extension
const mockRegisterCommand = jest.fn();
const mockOnDidOpenTextDocument = jest.fn();
const mockOnDidCloseTextDocument = jest.fn();
const mockSubscribe = jest.fn();
const mockPush = jest.fn();

jest.unstable_mockModule('vscode', () => ({
  window: {
    showInformationMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    activeTextEditor: undefined,
  },
  workspace: {
    onDidOpenTextDocument: mockOnDidOpenTextDocument,
    onDidCloseTextDocument: mockOnDidCloseTextDocument,
  },
  commands: {
    registerCommand: mockRegisterCommand,
  },
  ViewColumn: {
    Two: 2,
  },
  Uri: {
    file: jest.fn((path: string) => ({ path, fsPath: path })),
  },
  ExtensionContext: jest.fn(),
}));

// Mock the managers and providers
const mockStartLSPForDocument = jest.fn();
const mockStopLSPForDocument = jest.fn();
const mockRestartLSPForDocument = jest.fn();
const mockDispose = jest.fn();
const mockShow = jest.fn();
const mockShowPreview = jest.fn();

jest.unstable_mockModule('../../src/managers/LSPManager', () => ({
  LSPManager: jest.fn().mockImplementation(() => ({
    startLSPForDocument: mockStartLSPForDocument,
    stopLSPForDocument: mockStopLSPForDocument,
    restartLSPForDocument: mockRestartLSPForDocument,
    dispose: mockDispose,
  })),
}));

jest.unstable_mockModule('../../src/providers/StructureViewer', () => ({
  StructureViewer: jest.fn().mockImplementation(() => ({
    show: mockShow,
    showPreview: mockShowPreview,
  })),
}));

jest.unstable_mockModule('../../src/providers/DataPlotter', () => ({
  DataPlotter: jest.fn().mockImplementation(() => ({
    show: mockShow,
  })),
}));

import type * as vscode from 'vscode';

// Import extension after mocks
const { activate, deactivate } = await import('../../src/extension');

describe('Extension', () => {
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      subscriptions: {
        push: mockPush,
      },
      extensionUri: { fsPath: '/test/extension' } as vscode.Uri,
    } as unknown as vscode.ExtensionContext;
  });

  describe('activate', () => {
    it('should activate the extension and register all commands', () => {
      activate(mockContext);

      // Should register 7 commands
      expect(mockRegisterCommand).toHaveBeenCalledTimes(7);
      expect(mockPush).toHaveBeenCalled();
    });

    it('should register visualizeStructure command', () => {
      activate(mockContext);

      expect(mockRegisterCommand).toHaveBeenCalledWith(
        'openqc.visualizeStructure',
        expect.any(Function)
      );
    });

    it('should register plotData command', () => {
      activate(mockContext);

      expect(mockRegisterCommand).toHaveBeenCalledWith(
        'openqc.plotData',
        expect.any(Function)
      );
    });

    it('should register previewInput command', () => {
      activate(mockContext);

      expect(mockRegisterCommand).toHaveBeenCalledWith(
        'openqc.previewInput',
        expect.any(Function)
      );
    });

    it('should register startLSP command', () => {
      activate(mockContext);

      expect(mockRegisterCommand).toHaveBeenCalledWith(
        'openqc.startLSP',
        expect.any(Function)
      );
    });

    it('should register stopLSP command', () => {
      activate(mockContext);

      expect(mockRegisterCommand).toHaveBeenCalledWith(
        'openqc.stopLSP',
        expect.any(Function)
      );
    });

    it('should register restartLSP command', () => {
      activate(mockContext);

      expect(mockRegisterCommand).toHaveBeenCalledWith(
        'openqc.restartLSP',
        expect.any(Function)
      );
    });

    it('should set up document open/close handlers', () => {
      activate(mockContext);

      expect(mockOnDidOpenTextDocument).toHaveBeenCalledWith(expect.any(Function));
      expect(mockOnDidCloseTextDocument).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('deactivate', () => {
    it('should dispose LSP manager on deactivate', () => {
      activate(mockContext);
      deactivate();

      expect(mockDispose).toHaveBeenCalled();
    });

    it('should handle deactivate without errors when extension was not fully activated', () => {
      expect(() => deactivate()).not.toThrow();
    });
  });
});
