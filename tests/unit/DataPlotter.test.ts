import { DataPlotter } from '../../src/providers/DataPlotter';
import { FileTypeDetector } from '../../src/managers/FileTypeDetector';
import * as vscode from 'vscode';

// Mock FileTypeDetector
jest.mock('../../src/managers/FileTypeDetector', () => ({
  FileTypeDetector: jest.fn().mockImplementation(() => ({
    detectSoftware: jest.fn((doc: any) => {
      if (doc.fileName.includes('.out')) return 'CP2K';
      if (doc.fileName.includes('OUTCAR')) return 'VASP';
      if (doc.fileName.includes('.log')) return 'Gaussian';
      return null;
    }),
  })),
}));

describe('DataPlotter', () => {
  let plotter: DataPlotter;
  const mockUri = { fsPath: '/test/extension' } as vscode.Uri;

  beforeEach(() => {
    jest.clearAllMocks();
    plotter = new DataPlotter(mockUri);
  });

  it('should create DataPlotter instance', () => {
    expect(plotter).toBeDefined();
    expect(FileTypeDetector).toHaveBeenCalled();
  });

  it('should show warning when no editor is provided', () => {
    plotter.show(undefined);
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('No active editor found');
  });

  it('should show warning for unsupported file type', () => {
    const mockEditor = {
      document: { fileName: '/test/random.txt', getText: () => 'random' },
    } as unknown as vscode.TextEditor;

    plotter.show(mockEditor);
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      'Unsupported file type for data plotting'
    );
  });

  it('should show with CP2K output file', () => {
    const mockEditor = {
      document: {
        fileName: '/test/output.out',
        getText: () => 'Total energy: -76.0',
      },
    } as unknown as vscode.TextEditor;

    plotter.show(mockEditor);
    // Should not show warning
  });

  it('should show with VASP OUTCAR file', () => {
    const mockEditor = {
      document: {
        fileName: '/test/OUTCAR',
        getText: () => 'energy  without entropy',
      },
    } as unknown as vscode.TextEditor;

    plotter.show(mockEditor);
    // Should not show warning
  });

  it('should show with Gaussian log file', () => {
    const mockEditor = {
      document: {
        fileName: '/test/molecule.log',
        getText: () => 'SCF Done',
      },
    } as unknown as vscode.TextEditor;

    plotter.show(mockEditor);
    // Should not show warning
  });
});
