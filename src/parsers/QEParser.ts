import { BaseParser, ParseResult, ParsedSection, ParsedParameter, ValidationResult, ParseError, ParseWarning } from './base';

export class QEParser extends BaseParser {
    private parsedResult: ParseResult | null = null;

    parseInput(): ParseResult {
        if (this.parsedResult) {
            return this.parsedResult;
        }

        const sections: ParsedSection[] = [];
        const parameters: ParsedParameter[] = [];
        const errors: ParseError[] = [];
        const warnings: ParseWarning[] = [];

        let currentSection: ParsedSection | null = null;
        let inNamelist = false;
        let namelistName = '';

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('!')) {
                continue;
            }

            if (trimmed.startsWith('&')) {
                namelistName = trimmed.substring(1).toUpperCase();
                
                if (namelistName.startsWith('END')) {
                    if (currentSection) {
                        currentSection.endLine = i;
                        sections.push(currentSection);
                        currentSection = null;
                    }
                    inNamelist = false;
                } else {
                    currentSection = {
                        name: namelistName,
                        startLine: i,
                        endLine: i,
                        parameters: []
                    };
                    inNamelist = true;
                }
            } else if (inNamelist && currentSection) {
                const params = this.parseNamelistLine(trimmed, i);
                currentSection.parameters.push(...params);
                parameters.push(...params);
            } else if (trimmed.startsWith('ATOMIC_SPECIES')) {
                if (currentSection) {
                    currentSection.endLine = i - 1;
                    sections.push(currentSection);
                }
                currentSection = {
                    name: 'ATOMIC_SPECIES',
                    startLine: i,
                    endLine: i,
                    parameters: []
                };
            } else if (trimmed.startsWith('ATOMIC_POSITIONS')) {
                if (currentSection) {
                    currentSection.endLine = i - 1;
                    sections.push(currentSection);
                }
                const parts = trimmed.split(/\s+/);
                currentSection = {
                    name: 'ATOMIC_POSITIONS',
                    startLine: i,
                    endLine: i,
                    parameters: [{
                        name: 'Units',
                        value: parts[1] || 'alat',
                        line: i
                    }]
                };
            } else if (trimmed.startsWith('K_POINTS')) {
                if (currentSection) {
                    currentSection.endLine = i - 1;
                    sections.push(currentSection);
                }
                const parts = trimmed.split(/\s+/);
                currentSection = {
                    name: 'K_POINTS',
                    startLine: i,
                    endLine: i,
                    parameters: [{
                        name: 'Type',
                        value: parts[1] || 'automatic',
                        line: i
                    }]
                };
            } else if (trimmed.startsWith('CELL_PARAMETERS')) {
                if (currentSection) {
                    currentSection.endLine = i - 1;
                    sections.push(currentSection);
                }
                const parts = trimmed.split(/\s+/);
                currentSection = {
                    name: 'CELL_PARAMETERS',
                    startLine: i,
                    endLine: i,
                    parameters: [{
                        name: 'Units',
                        value: parts[1] || 'alat',
                        line: i
                    }]
                };
            } else if (currentSection) {
                currentSection.endLine = i;
            }
        }

        if (currentSection) {
            currentSection.endLine = this.lines.length - 1;
            sections.push(currentSection);
        }

        this.parsedResult = { sections, parameters, errors, warnings };
        return this.parsedResult;
    }

    private parseNamelistLine(line: string, lineNum: number): ParsedParameter[] {
        const params: ParsedParameter[] = [];
        const assignments = line.split(/,/).filter(s => s.trim());

        for (const assignment of assignments) {
            const kv = this.parseKeyValue(assignment.trim(), '=');
            if (kv) {
                params.push({
                    name: kv.key.trim(),
                    value: this.convertValue(kv.value.trim()),
                    line: lineNum
                });
            }
        }

        return params;
    }

    private convertValue(value: string): string | number | boolean {
        const lower = value.toLowerCase();
        if (lower === '.true.' || lower === 'true' || lower === 't') {return true;}
        if (lower === '.false.' || lower === 'false' || lower === 'f') {return false;}
        
        const num = Number(value);
        if (!isNaN(num)) {return num;}
        
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
            return value.slice(1, -1);
        }
        
        return value;
    }

    validate(): ValidationResult {
        const result = this.parseInput();
        const errors = [...result.errors];
        const warnings = [...result.warnings];

        const hasControl = result.sections.some(s => s.name === 'CONTROL');
        const hasSystem = result.sections.some(s => s.name === 'SYSTEM');
        const hasElectrons = result.sections.some(s => s.name === 'ELECTRONS');

        if (!hasControl) {
            errors.push({
                message: 'Missing required &CONTROL namelist',
                line: 0,
                severity: 'error'
            });
        }

        if (!hasSystem) {
            errors.push({
                message: 'Missing required &SYSTEM namelist',
                line: 0,
                severity: 'error'
            });
        }

        if (!hasElectrons) {
            warnings.push({
                message: 'Missing &ELECTRONS namelist (will use defaults)',
                line: 0
            });
        }

        const controlSection = result.sections.find(s => s.name === 'CONTROL');
        if (controlSection) {
            const hasCalc = controlSection.parameters.some(p => 
                p.name.toLowerCase() === 'calculation'
            );
            if (!hasCalc) {
                warnings.push({
                    message: 'calculation parameter not set in &CONTROL',
                    line: controlSection.startLine
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
