// Jest setup file
import { jest } from '@jest/globals';

// Mock VS Code API
global.vscode = {
  window: {
    showInformationMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    activeTextEditor: undefined,
    createWebviewPanel: jest.fn(() => ({
      webview: { html: '' },
      onDidDispose: jest.fn(),
      reveal: jest.fn(),
      dispose: jest.fn(),
    })),
  },
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn((key: string, defaultValue: any) => defaultValue),
    })),
    createFileSystemWatcher: jest.fn(() => ({
      onDidCreate: jest.fn(),
      onDidChange: jest.fn(),
      onDidDelete: jest.fn(),
    })),
    onDidOpenTextDocument: jest.fn(),
    onDidCloseTextDocument: jest.fn(),
  },
  commands: {
    registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
  },
  ViewColumn: { One: 1, Two: 2, Three: 3 },
  Uri: {
    file: jest.fn((path: string) => ({ path })),
    parse: jest.fn((uri: string) => ({ path: uri })),
  },
} as any;

beforeEach(() => {
  jest.clearAllMocks();
});
