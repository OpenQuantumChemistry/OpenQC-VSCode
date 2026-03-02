import * as vscode from 'vscode';
import { LSPManager } from './managers/LSPManager';
import { StructureViewer } from './providers/StructureViewer';
import { DataPlotter } from './providers/DataPlotter';
import {
  CompletionProvider,
  DiagnosticsProvider,
  HoverProvider,
  DefinitionProvider,
} from './providers/lsp';
import { FileTypeDetector } from './managers/FileTypeDetector';

let lspManager: LSPManager;
let structureViewer: StructureViewer;
let dataPlotter: DataPlotter;
let diagnosticsProvider: DiagnosticsProvider;
let fileTypeDetector: FileTypeDetector;

export function activate(context: vscode.ExtensionContext) {
  console.log('OpenQC-VSCode extension is now active!');

  // Initialize FileTypeDetector
  fileTypeDetector = new FileTypeDetector();

  // Initialize LSP Manager
  lspManager = new LSPManager();

  // Initialize visualization providers
  structureViewer = new StructureViewer(context.extensionUri);
  dataPlotter = new DataPlotter(context.extensionUri);

  // Initialize LSP providers
  diagnosticsProvider = new DiagnosticsProvider();
  const completionProvider = new CompletionProvider();
  const hoverProvider = new HoverProvider();
  const definitionProvider = new DefinitionProvider();

  // Language IDs for quantum chemistry software
  const languageIds = ['cp2k', 'vasp', 'gaussian', 'orca', 'qe', 'gamess', 'nwchem'];

  // Register language providers
  const disposables = [
    // Completion provider
    vscode.languages.registerCompletionItemProvider(
      languageIds,
      completionProvider,
      '=',
      ' ',
      '\n'
    ),

    // Hover provider
    vscode.languages.registerHoverProvider(languageIds, hoverProvider),

    // Definition provider
    vscode.languages.registerDefinitionProvider(languageIds, definitionProvider),

    // Validation on document change
    vscode.workspace.onDidChangeTextDocument(event => {
      diagnosticsProvider.validateDocument(event.document);
    }),

    // Validation on document save
    vscode.workspace.onDidSaveTextDocument(document => {
      diagnosticsProvider.validateDocument(document);
    }),

    // Clear diagnostics on document close
    vscode.workspace.onDidCloseTextDocument(document => {
      diagnosticsProvider.clearDiagnostics(document);
    }),

    // Visualization commands
    vscode.commands.registerCommand('openqc.visualizeStructure', () => {
      structureViewer.show(vscode.window.activeTextEditor);
    }),

    vscode.commands.registerCommand('openqc.plotData', () => {
      dataPlotter.show(vscode.window.activeTextEditor);
    }),

    vscode.commands.registerCommand('openqc.previewInput', () => {
      structureViewer.showPreview(vscode.window.activeTextEditor);
    }),

    // LSP management commands
    vscode.commands.registerCommand('openqc.startLSP', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await lspManager.startLSPForDocument(editor.document);
      }
    }),

    vscode.commands.registerCommand('openqc.stopLSP', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await lspManager.stopLSPForDocument(editor.document);
      }
    }),

    vscode.commands.registerCommand('openqc.restartLSP', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await lspManager.restartLSPForDocument(editor.document);
      }
    }),

    // Validate current document
    vscode.commands.registerCommand('openqc.validate', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await diagnosticsProvider.validateDocument(editor.document);
        vscode.window.showInformationMessage('Input file validated');
      }
    }),

    // Auto-start LSP on document open
    vscode.workspace.onDidOpenTextDocument(async document => {
      await lspManager.startLSPForDocument(document);
      // Also validate the document
      if (fileTypeDetector.detectSoftware(document)) {
        await diagnosticsProvider.validateDocument(document);
      }
    }),

    // Clean up LSP on document close
    vscode.workspace.onDidCloseTextDocument(async document => {
      await lspManager.stopLSPForDocument(document);
      diagnosticsProvider.clearDiagnostics(document);
    }),
  ];

  context.subscriptions.push(...disposables);
  context.subscriptions.push(diagnosticsProvider);

  // Start LSP and validate for already open documents
  vscode.window.visibleTextEditors.forEach(async editor => {
    await lspManager.startLSPForDocument(editor.document);
    if (fileTypeDetector.detectSoftware(editor.document)) {
      await diagnosticsProvider.validateDocument(editor.document);
    }
  });
}

export function deactivate() {
  if (lspManager) {
    lspManager.dispose();
  }
  if (diagnosticsProvider) {
    diagnosticsProvider.dispose();
  }
}
