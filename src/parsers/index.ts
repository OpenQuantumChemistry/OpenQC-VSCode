/**
 * OpenQC-VSCode Parsers
 * Input file parsers for quantum chemistry software
 */

export * from './base';
export { VASPParser } from './VASPParser';
export { GaussianParser } from './GaussianParser';
export { ORCAParser } from './ORCAParser';
export { CP2KParser } from './CP2KParser';
export { QEParser } from './QEParser';
export { GAMESSParser } from './GAMESSParser';
export { NWChemParser } from './NWChemParser';

import { BaseParser } from './base';
import { VASPParser } from './VASPParser';
import { GaussianParser } from './GaussianParser';
import { ORCAParser } from './ORCAParser';
import { CP2KParser } from './CP2KParser';
import { QEParser } from './QEParser';
import { GAMESSParser } from './GAMESSParser';
import { NWChemParser } from './NWChemParser';
import { QuantumChemistrySoftware } from '../managers/FileTypeDetector';

/**
 * Create appropriate parser for the given software and content
 */
export function createParser(
  software: QuantumChemistrySoftware,
  content: string,
  filename?: string
): BaseParser {
  switch (software) {
    case 'VASP':
      return new VASPParser(content, filename || 'INCAR');
    case 'Gaussian':
      return new GaussianParser(content);
    case 'ORCA':
      return new ORCAParser(content);
    case 'CP2K':
      return new CP2KParser(content);
    case 'Quantum ESPRESSO':
      return new QEParser(content);
    case 'GAMESS':
      return new GAMESSParser(content);
    case 'NWChem':
      return new NWChemParser(content);
    default:
      throw new Error(`Unsupported software: ${software}`);
  }
}

/**
 * Parse input file and return structured result
 */
export function parseInput(software: QuantumChemistrySoftware, content: string, filename?: string) {
  const parser = createParser(software, content, filename);
  return parser.parseInput();
}

/**
 * Validate input file syntax
 */
export function validateInput(
  software: QuantumChemistrySoftware,
  content: string,
  filename?: string
) {
  const parser = createParser(software, content, filename);
  return parser.validate();
}
