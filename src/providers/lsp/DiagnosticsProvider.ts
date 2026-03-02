import * as vscode from 'vscode';
import { createParser } from '../../parsers';
import { FileTypeDetector } from '../../managers/FileTypeDetector';

export class DiagnosticsProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private fileTypeDetector: FileTypeDetector;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('openqc');
    this.fileTypeDetector = new FileTypeDetector();
  }

  /**
   * Validate document and update diagnostics
   */
  async validateDocument(document: vscode.TextDocument): Promise<void> {
    const software = this.fileTypeDetector.detectSoftware(document);
    if (!software) {
      this.diagnosticCollection.delete(document.uri);
      return;
    }

    const content = document.getText();
    const filename = document.fileName.split(/[\\/]/).pop() || '';

    try {
      const parser = createParser(software, content, filename);
      const validation = parser.validate();
      const diagnostics: vscode.Diagnostic[] = [];

      for (const error of validation.errors) {
        const range =
          error.line < document.lineCount
            ? document.lineAt(error.line).range
            : new vscode.Range(0, 0, 0, 0);

        const diagnostic = new vscode.Diagnostic(
          range,
          error.message,
          vscode.DiagnosticSeverity.Error
        );
        diagnostic.source = 'OpenQC';
        diagnostic.code = `${software}-error`;
        diagnostics.push(diagnostic);
      }

      for (const warning of validation.warnings) {
        const range =
          warning.line < document.lineCount
            ? document.lineAt(warning.line).range
            : new vscode.Range(0, 0, 0, 0);

        const diagnostic = new vscode.Diagnostic(
          range,
          warning.message,
          vscode.DiagnosticSeverity.Warning
        );
        diagnostic.source = 'OpenQC';
        diagnostic.code = `${software}-warning`;
        diagnostics.push(diagnostic);
      }

      this.diagnosticCollection.set(document.uri, diagnostics);
    } catch (error) {
      console.error('Error validating document:', error);
    }
  }

  /**
   * Clear diagnostics for a document
   */
  clearDiagnostics(document: vscode.TextDocument): void {
    this.diagnosticCollection.delete(document.uri);
  }

  /**
   * Clear all diagnostics
   */
  clearAllDiagnostics(): void {
    this.diagnosticCollection.clear();
  }

  /**
   * Dispose of the diagnostic collection
   */
  dispose(): void {
    this.diagnosticCollection.dispose();
  }
}
