import { BaseParser, ParseResult, ParsedSection, ParsedParameter, ValidationResult, ParseError, ParseWarning } from './base';

export interface GaussianRouteSection {
    method: string;
    basis: string;
    options: string[];
}

export class GaussianParser extends BaseParser {
    private parsedResult: ParseResult | null = null;

    parseInput(): ParseResult {
        if (this.parsedResult) {
            return this.parsedResult;
        }

        const sections: ParsedSection[] = [];
        const parameters: ParsedParameter[] = [];
        const errors: ParseError[] = [];
        const warnings: ParseWarning[] = [];

        let lineIdx = 0;
        let sectionType = 'link0';
        let routeLine = '';

        while (lineIdx < this.lines.length) {
            const line = this.lines[lineIdx].trim();

            if (!line) {
                lineIdx++;
                continue;
            }

            if (line.startsWith('%')) {
                const kv = this.parseLink0Line(line);
                if (kv) {
                    parameters.push({
                        name: kv.key,
                        value: kv.value,
                        line: lineIdx
                    });
                }
            } else if (line.startsWith('#')) {
                sectionType = 'route';
                routeLine += ' ' + line.substring(1).trim();
            } else if (sectionType === 'route' && line && !line.match(/^\s*\d+\s+\d+/)) {
                routeLine += ' ' + line;
            } else if (line.match(/^\s*\d+\s+\d+\s*$/)) {
                sectionType = 'charge_multiplicity';
                const parts = line.trim().split(/\s+/);
                parameters.push({ name: 'Charge', value: parseInt(parts[0]), line: lineIdx });
                parameters.push({ name: 'Multiplicity', value: parseInt(parts[1]), line: lineIdx });
            } else if (sectionType === 'charge_multiplicity') {
                sectionType = 'geometry';
            }

            lineIdx++;
        }

        if (routeLine) {
            const routeParams = this.parseRouteSection(routeLine.trim());
            parameters.push(...routeParams);
        }

        sections.push({
            name: 'GaussianInput',
            startLine: 0,
            endLine: this.lines.length - 1,
            parameters
        });

        if (!routeLine.trim()) {
            errors.push({
                message: 'Missing route section (should start with #)',
                line: 0,
                severity: 'error'
            });
        }

        this.parsedResult = { sections, parameters, errors, warnings };
        return this.parsedResult;
    }

    private parseLink0Line(line: string): { key: string; value: string } | null {
        const match = line.match(/^%(\w+)=(.+)$/);
        if (match) {
            return { key: match[1], value: match[2] };
        }
        return null;
    }

    private parseRouteSection(routeLine: string): ParsedParameter[] {
        const params: ParsedParameter[] = [];
        
        const methodMatch = routeLine.match(/\b(HF|DFT|MP2|CCSD|B3LYP|PBE|BLYP|BP86|M06|wB97X)\b/i);
        if (methodMatch) {
            params.push({ name: 'Method', value: methodMatch[1], line: 0 });
        }

        const basisMatch = routeLine.match(/\/(\S+)/);
        if (basisMatch) {
            params.push({ name: 'Basis', value: basisMatch[1], line: 0 });
        } else if (routeLine.includes('gen') || routeLine.includes('GEN')) {
            params.push({ name: 'Basis', value: 'Gen', line: 0 });
        }

        const calcTypeMatch = routeLine.match(/\b(opt|freq|sp|td|scan|irc)\b/i);
        if (calcTypeMatch) {
            params.push({ name: 'CalculationType', value: calcTypeMatch[1], line: 0 });
        }

        const options = routeLine.split(/\s+/).filter(w => w && !w.startsWith('/'));
        params.push({ name: 'RouteOptions', value: options.join(' '), line: 0 });

        return params;
    }

    validate(): ValidationResult {
        const result = this.parseInput();
        const errors = [...result.errors];
        const warnings = [...result.warnings];

        const hasRoute = result.parameters.some(p => p.name === 'Method');
        if (!hasRoute) {
            errors.push({
                message: 'Route section must specify a calculation method',
                line: 0,
                severity: 'error'
            });
        }

        const hasCharge = result.parameters.some(p => p.name === 'Charge');
        if (!hasCharge) {
            errors.push({
                message: 'Missing charge and multiplicity section',
                line: 0,
                severity: 'error'
            });
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
