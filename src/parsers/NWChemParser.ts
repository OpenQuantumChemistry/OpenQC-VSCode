import { BaseParser, ParseResult, ParsedSection, ParsedParameter, ValidationResult, ParseError, ParseWarning } from './base';

export class NWChemParser extends BaseParser {
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
        let currentBlockName = '';

        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            const trimmed = line.trim().toLowerCase();

            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }

            const blockKeywords = ['geometry', 'basis', 'scf', 'dft', 'mp2', 'ccsd', 'task', 'property'];
            const words = trimmed.split(/\s+/);
            const firstWord = words[0];

            if (blockKeywords.includes(firstWord)) {
                if (currentSection) {
                    currentSection.endLine = i - 1;
                    sections.push(currentSection);
                }

                currentBlockName = firstWord.toUpperCase();
                const blockParams = this.parseBlockHeader(trimmed, i);
                
                currentSection = {
                    name: currentBlockName,
                    startLine: i,
                    endLine: i,
                    parameters: blockParams
                };
                parameters.push(...blockParams);
            } else if (trimmed === 'end') {
                if (currentSection) {
                    currentSection.endLine = i;
                    sections.push(currentSection);
                    currentSection = null;
                    currentBlockName = '';
                }
            } else if (currentSection) {
                const blockParams = this.parseBlockContent(trimmed, i, currentBlockName);
                currentSection.parameters.push(...blockParams);
                parameters.push(...blockParams);
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

    private parseBlockHeader(line: string, lineNum: number): ParsedParameter[] {
        const params: ParsedParameter[] = [];
        const words = line.split(/\s+/);
        
        if (words.length > 1) {
            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                if (word.includes('=')) {
                    const kv = this.parseKeyValue(word, '=');
                    if (kv) {
                        params.push({
                            name: kv.key,
                            value: this.convertValue(kv.value),
                            line: lineNum
                        });
                    }
                } else {
                    params.push({
                        name: 'Option',
                        value: word,
                        line: lineNum
                    });
                }
            }
        }

        return params;
    }

    private parseBlockContent(line: string, lineNum: number, blockName: string): ParsedParameter[] {
        const params: ParsedParameter[] = [];
        
        if (line.includes('=')) {
            const kv = this.parseKeyValue(line, '=');
            if (kv) {
                params.push({
                    name: kv.key,
                    value: this.convertValue(kv.value),
                    line: lineNum
                });
            }
        } else if (blockName === 'GEOMETRY' && /^[a-zA-Z]{1,2}\s+[\d\-\.]/.test(line)) {
            const parts = line.split(/\s+/);
            if (parts.length >= 4) {
                params.push({
                    name: `Atom_${parts[0]}`,
                    value: [parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])],
                    line: lineNum
                });
            }
        } else if (blockName === 'BASIS' && !line.startsWith('end')) {
            params.push({
                name: 'BasisEntry',
                value: line,
                line: lineNum
            });
        } else if (line) {
            params.push({
                name: 'Setting',
                value: line,
                line: lineNum
            });
        }

        return params;
    }

    private convertValue(value: string): string | number | boolean {
        const lower = value.toLowerCase();
        if (lower === 'true' || lower === 'yes' || lower === 'on') {return true;}
        if (lower === 'false' || lower === 'no' || lower === 'off') {return false;}
        
        const num = Number(value);
        if (!isNaN(num)) {return num;}
        
        return value;
    }

    validate(): ValidationResult {
        const result = this.parseInput();
        const errors = [...result.errors];
        const warnings = [...result.warnings];

        const hasGeometry = result.sections.some(s => s.name === 'GEOMETRY');
        const hasBasis = result.sections.some(s => s.name === 'BASIS');
        const hasTask = result.sections.some(s => s.name === 'TASK');
        const hasSCF = result.sections.some(s => s.name === 'SCF');
        const hasDFT = result.sections.some(s => s.name === 'DFT');

        if (!hasGeometry) {
            errors.push({
                message: 'Missing required GEOMETRY block',
                line: 0,
                severity: 'error'
            });
        }

        if (!hasBasis) {
            errors.push({
                message: 'Missing required BASIS block',
                line: 0,
                severity: 'error'
            });
        }

        if (!hasTask) {
            errors.push({
                message: 'Missing required TASK directive',
                line: 0,
                severity: 'error'
            });
        }

        if (!hasSCF && !hasDFT) {
            warnings.push({
                message: 'No SCF or DFT block defined (will use defaults)',
                line: 0
            });
        }

        const taskSection = result.sections.find(s => s.name === 'TASK');
        if (taskSection) {
            const settingParam = taskSection.parameters.find(p => p.name === 'Setting');
            if (settingParam) {
                const validTheories = ['scf', 'dft', 'mp2', 'ccsd', 'tce'];
                const value = String(settingParam.value).toLowerCase();
                if (!validTheories.some(t => value.includes(t))) {
                    warnings.push({
                        message: `Unrecognized theory in TASK: ${value}`,
                        line: taskSection.startLine
                    });
                }
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
