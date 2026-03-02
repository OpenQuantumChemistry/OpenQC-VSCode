import { BaseParser, ParseResult, ParsedSection, ParsedParameter, ValidationResult, ParseError, ParseWarning } from './base';

export class CP2KParser extends BaseParser {
    private parsedResult: ParseResult | null = null;

    parseInput(): ParseResult {
        if (this.parsedResult) {
            return this.parsedResult;
        }

        const sections: ParsedSection[] = [];
        const parameters: ParsedParameter[] = [];
        const errors: ParseError[] = [];
        const warnings: ParseWarning[] = [];

        const sectionStack: ParsedSection[] = [];

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }

            if (trimmed.startsWith('&')) {
                const sectionName = trimmed.substring(1).split(/\s+/)[0].toUpperCase();
                
                if (trimmed.toUpperCase().startsWith('&END') || trimmed.toUpperCase() === '&' + sectionName + ' END') {
                    if (sectionStack.length > 0) {
                        const closedSection = sectionStack.pop()!;
                        closedSection.endLine = i;
                        
                        if (sectionStack.length > 0) {
                            if (!sectionStack[sectionStack.length - 1].subsections) {
                                sectionStack[sectionStack.length - 1].subsections = [];
                            }
                            sectionStack[sectionStack.length - 1].subsections!.push(closedSection);
                        } else {
                            sections.push(closedSection);
                        }
                    }
                } else {
                    const newSection: ParsedSection = {
                        name: sectionName,
                        startLine: i,
                        endLine: i,
                        parameters: []
                    };
                    sectionStack.push(newSection);
                }
            } else if (sectionStack.length > 0) {
                const kv = this.parseKeyValueCP2K(trimmed);
                if (kv) {
                    const param: ParsedParameter = {
                        name: kv.key,
                        value: this.convertValue(kv.value),
                        line: i
                    };
                    sectionStack[sectionStack.length - 1].parameters.push(param);
                    parameters.push(param);
                }
            } else {
                const kv = this.parseKeyValueCP2K(trimmed);
                if (kv) {
                    parameters.push({
                        name: kv.key,
                        value: this.convertValue(kv.value),
                        line: i
                    });
                }
            }
        }

        while (sectionStack.length > 0) {
            const section = sectionStack.pop()!;
            section.endLine = this.lines.length - 1;
            
            if (sectionStack.length > 0) {
                if (!sectionStack[sectionStack.length - 1].subsections) {
                    sectionStack[sectionStack.length - 1].subsections = [];
                }
                sectionStack[sectionStack.length - 1].subsections!.push(section);
            } else {
                sections.push(section);
            }
            
            errors.push({
                message: `Section ${section.name} not properly closed`,
                line: section.startLine,
                severity: 'error'
            });
        }

        this.parsedResult = { sections, parameters, errors, warnings };
        return this.parsedResult;
    }

    private parseKeyValueCP2K(line: string): { key: string; value: string } | null {
        const parts = line.split(/\s+/).filter(p => p.trim());
        if (parts.length >= 2) {
            return { key: parts[0], value: parts.slice(1).join(' ') };
        }
        return null;
    }

    private convertValue(value: string): string | number | boolean {
        const lower = value.toLowerCase();
        if (lower === 'true' || lower === 'yes' || lower === 'on') return true;
        if (lower === 'false' || lower === 'no' || lower === 'off') return false;
        
        const num = Number(value);
        if (!isNaN(num)) return num;
        
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.slice(1, -1);
        }
        
        return value;
    }

    validate(): ValidationResult {
        const result = this.parseInput();
        const errors = [...result.errors];
        const warnings = [...result.warnings];

        const hasGlobal = result.sections.some(s => s.name === 'GLOBAL');
        const hasForceEval = result.sections.some(s => s.name === 'FORCE_EVAL');

        if (!hasGlobal) {
            warnings.push({
                message: 'Missing &GLOBAL section',
                line: 0
            });
        }

        if (!hasForceEval) {
            errors.push({
                message: 'Missing required &FORCE_EVAL section',
                line: 0,
                severity: 'error'
            });
        }

        const globalSection = result.sections.find(s => s.name === 'GLOBAL');
        if (globalSection) {
            const hasProjectName = globalSection.parameters.some(p => 
                p.name.toUpperCase() === 'PROJECT_NAME'
            );
            if (!hasProjectName) {
                warnings.push({
                    message: 'PROJECT_NAME not set in &GLOBAL',
                    line: globalSection.startLine
                });
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    getSections(): ParsedSection[] {
        return this.parseInput().sections;
    }

    getParameters(): ParsedParameter[] {
        return this.parseInput().parameters;
    }

    getParameter(name: string): ParsedParameter | undefined {
        return this.parseInput().parameters.find(p => 
            p.name.toLowerCase() === name.toLowerCase()
        );
    }

    getSection(name: string): ParsedSection | undefined {
        return this.parseInput().sections.find(s => 
            s.name.toLowerCase() === name.toLowerCase()
        );
    }
}
