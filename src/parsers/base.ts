/**
 * Base parser interface for quantum chemistry input files
 */

export interface ParsedParameter {
  name: string;
  value: string | number | boolean | number[];
  line: number;
  description?: string;
}

export interface ParsedSection {
  name: string;
  startLine: number;
  endLine: number;
  parameters: ParsedParameter[];
  subsections?: ParsedSection[];
}

export interface ParseResult {
  sections: ParsedSection[];
  parameters: ParsedParameter[];
  errors: ParseError[];
  warnings: ParseWarning[];
}

export interface ParseError {
  message: string;
  line: number;
  severity: 'error' | 'warning';
}

export interface ParseWarning {
  message: string;
  line: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ParseError[];
  warnings: ParseWarning[];
}

export abstract class BaseParser {
  protected content: string;
  protected lines: string[];

  constructor(content: string) {
    this.content = content;
    this.lines = content.split('\n');
  }

  abstract parseInput(): ParseResult;
  abstract validate(): ValidationResult;
  abstract getSections(): ParsedSection[];
  abstract getParameters(): ParsedParameter[];
  abstract getParameter(name: string): ParsedParameter | undefined;
  abstract getSection(name: string): ParsedSection | undefined;

  protected getLineNumber(position: number): number {
    let line = 0;
    let currentPos = 0;
    for (const lineContent of this.lines) {
      if (currentPos + lineContent.length >= position) {
        return line;
      }
      currentPos += lineContent.length + 1;
      line++;
    }
    return line;
  }

  protected stripComments(line: string, commentChars: string[] = ['#', '!']): string {
    let result = line;
    for (const char of commentChars) {
      const index = result.indexOf(char);
      if (index !== -1) {
        result = result.substring(0, index);
      }
    }
    return result.trim();
  }

  protected parseKeyValue(
    line: string,
    delimiter: string | RegExp = /\s*=\s*|\s+/
  ): { key: string; value: string } | null {
    const parts = line.split(delimiter).filter(p => p.trim());
    if (parts.length >= 2) {
      return { key: parts[0].trim(), value: parts.slice(1).join(' ').trim() };
    }
    return null;
  }
}
