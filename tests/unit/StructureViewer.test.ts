import { StructureViewer } from '../../src/providers/StructureViewer';
import { FileTypeDetector } from '../../src/managers/FileTypeDetector';
import { Molecule3D } from '../../src/visualizers/Molecule3D';
import * as vscode from 'vscode';

// Mock dependencies
jest.mock('../../src/managers/FileTypeDetector', () => ({
  FileTypeDetector: jest.fn().mockImplementation(() => ({
    detectSoftware: jest.fn((doc: any) => {
      if (doc.fileName.includes('.inp')) return 'CP2K';
      if (doc.fileName.includes('.gjf')) return 'Gaussian';
      if (doc.fileName.includes('.com')) return 'Gaussian';
      return null;
    }),
    getSoftwareInfo: jest.fn(() => ({
      name: 'Test',
      description: 'Test Software',
      website: 'https://test.com',
    })),
  })),
}));

jest.mock('../../src/visualizers/Molecule3D', () => ({
  Molecule3D: jest.fn().mockImplementation(() => ({
    parseAtoms: jest.fn(() => [
      { elem: 'H', x: 0, y: 0, z: 0 },
      { elem: 'H', x: 0, y: 0, z: 0.74 },
    ]),
  })),
}));

describe('StructureViewer', () => {
  let viewer: StructureViewer;
  const mockUri = { fsPath: '/test/extension' } as vscode.Uri;

  beforeEach(() => {
    jest.clearAllMocks();
    viewer = new StructureViewer(mockUri);
  });

  it('should create StructureViewer instance', () => {
    expect(viewer).toBeDefined();
    expect(FileTypeDetector).toHaveBeenCalled();
    expect(Molecule3D).toHaveBeenCalled();
  });

  it('should show warning when no editor is provided', () => {
    viewer.show(undefined);
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('No active editor found');
  });

  it('should show warning for unsupported file type', () => {
    const mockEditor = {
      document: { fileName: '/test/random.txt', getText: () => 'random' },
    } as unknown as vscode.TextEditor;

    viewer.show(mockEditor);
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      'Unsupported file type for structure visualization'
    );
  });

  it('should show preview warning when no editor is provided', () => {
    viewer.showPreview(undefined);
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('No active editor found');
  });

  it('should show preview warning for unsupported file type', () => {
    const mockEditor = {
      document: { fileName: '/test/random.txt', getText: () => 'random' },
    } as unknown as vscode.TextEditor;

    viewer.showPreview(mockEditor);
    expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
      'Unsupported file type for input preview'
    );
  });

  it('should show with CP2K file', () => {
    const mockEditor = {
      document: {
        fileName: '/test/cp2k.inp',
        getText: () => '&GLOBAL\nPROJECT test\n&END GLOBAL',
      },
    } as unknown as vscode.TextEditor;

    viewer.show(mockEditor);
    // Should not show warning
  });

  it('should show preview with Gaussian file', () => {
    const mockEditor = {
      document: {
        fileName: '/test/molecule.gjf',
        getText: () => '%chk=test.chk\n# B3LYP/6-31G*',
      },
    } as unknown as vscode.TextEditor;

    viewer.showPreview(mockEditor);
    // Should not show warning
  });
});
