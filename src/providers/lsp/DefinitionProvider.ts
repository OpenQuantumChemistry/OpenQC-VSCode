import * as vscode from 'vscode';
import { FileTypeDetector } from '../../managers/FileTypeDetector';
import { createParser } from '../../parsers';

export class DefinitionProvider implements vscode.DefinitionProvider {
    private fileTypeDetector: FileTypeDetector;

    constructor() {
        this.fileTypeDetector = new FileTypeDetector();
    }

    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
        const software = this.fileTypeDetector.detectSoftware(document);
        if (!software) {
            return null;
        }

        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }

        const word = document.getText(wordRange);
        const content = document.getText();
        const filename = document.fileName.split(/[\\/]/).pop() || '';

        try {
            const parser = createParser(software, content, filename);
            const sections = parser.getSections();

            for (const section of sections) {
                for (const param of section.parameters) {
                    if (param.name.toLowerCase() === word.toLowerCase()) {
                        const line = document.lineAt(param.line);
                        return new vscode.Location(
                            document.uri,
                            new vscode.Range(param.line, 0, param.line, line.text.length)
                        );
                    }
                }
            }

            for (const section of sections) {
                if (section.name.toLowerCase() === word.toLowerCase()) {
                    return new vscode.Location(
                        document.uri,
                        new vscode.Range(section.startLine, 0, section.startLine, 0)
                    );
                }
            }
        } catch (error) {
            console.error('Error providing definition:', error);
        }

        return null;
    }
}
