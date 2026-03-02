import { createParser, parseInput, validateInput } from '../../../src/parsers';
import { VASPParser } from '../../../src/parsers/VASPParser';
import { GaussianParser } from '../../../src/parsers/GaussianParser';
import { ORCAParser } from '../../../src/parsers/ORCAParser';
import { CP2KParser } from '../../../src/parsers/CP2KParser';
import { QEParser } from '../../../src/parsers/QEParser';
import { GAMESSParser } from '../../../src/parsers/GAMESSParser';
import { NWChemParser } from '../../../src/parsers/NWChemParser';

describe('Parsers Index', () => {
  describe('createParser', () => {
    it('should create VASP parser', () => {
      const parser = createParser('VASP', 'ENCUT = 520', 'INCAR');
      expect(parser).toBeInstanceOf(VASPParser);
    });

    it('should create Gaussian parser', () => {
      const parser = createParser('Gaussian', '# B3LYP/6-31G(d)');
      expect(parser).toBeInstanceOf(GaussianParser);
    });

    it('should create ORCA parser', () => {
      const parser = createParser('ORCA', '! RHF def2-SVP');
      expect(parser).toBeInstanceOf(ORCAParser);
    });

    it('should create CP2K parser', () => {
      const parser = createParser('CP2K', '&GLOBAL\n&END GLOBAL');
      expect(parser).toBeInstanceOf(CP2KParser);
    });

    it('should create Quantum ESPRESSO parser', () => {
      const parser = createParser('Quantum ESPRESSO', '&CONTROL\n/');
      expect(parser).toBeInstanceOf(QEParser);
    });

    it('should create GAMESS parser', () => {
      const parser = createParser('GAMESS', '$CONTRL $END');
      expect(parser).toBeInstanceOf(GAMESSParser);
    });

    it('should create NWChem parser', () => {
      const parser = createParser('NWChem', 'geometry\nend');
      expect(parser).toBeInstanceOf(NWChemParser);
    });

    it('should throw error for unsupported software', () => {
      expect(() => createParser('Unknown' as any, 'content')).toThrow(
        'Unsupported software: Unknown'
      );
    });
  });

  describe('parseInput', () => {
    it('should parse VASP input', () => {
      const result = parseInput('VASP', 'ENCUT = 520\nPREC = Accurate', 'INCAR');
      expect(result).toHaveProperty('sections');
      expect(result).toHaveProperty('parameters');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });

    it('should parse Gaussian input', () => {
      const result = parseInput('Gaussian', '# B3LYP/6-31G(d)');
      expect(result).toHaveProperty('sections');
      expect(result).toHaveProperty('parameters');
    });

    it('should parse ORCA input', () => {
      const result = parseInput('ORCA', '! RHF def2-SVP');
      expect(result).toHaveProperty('sections');
      expect(result).toHaveProperty('parameters');
    });

    it('should parse CP2K input', () => {
      const result = parseInput('CP2K', '&GLOBAL\n  PROJECT_NAME test\n&END GLOBAL');
      expect(result).toHaveProperty('sections');
      expect(result).toHaveProperty('parameters');
    });

    it('should parse Quantum ESPRESSO input', () => {
      const result = parseInput('Quantum ESPRESSO', "&CONTROL\ncalculation = 'scf'\n/");
      expect(result).toHaveProperty('sections');
      expect(result).toHaveProperty('parameters');
    });

    it('should parse GAMESS input', () => {
      const result = parseInput('GAMESS', '$CONTRL RUNTYP=ENERGY $END');
      expect(result).toHaveProperty('sections');
      expect(result).toHaveProperty('parameters');
    });

    it('should parse NWChem input', () => {
      const result = parseInput('NWChem', 'geometry\n  H 0 0 0\nend');
      expect(result).toHaveProperty('sections');
      expect(result).toHaveProperty('parameters');
    });
  });

  describe('validateInput', () => {
    it('should validate VASP input', () => {
      const result = validateInput('VASP', 'ENCUT = 520', 'INCAR');
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });

    it('should validate Gaussian input', () => {
      const result = validateInput('Gaussian', '# B3LYP/6-31G(d)\n\nTest\n\n0 1\nH 0 0 0');
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
    });
  });
});

describe('VASPParser', () => {
  describe('parseInput', () => {
    it('should parse simple INCAR', () => {
      const parser = new VASPParser('ENCUT = 520', 'INCAR');
      const result = parser.parseInput();
      expect(result.parameters).toBeDefined();
    });

    it('should parse INCAR with multiple parameters', () => {
      const content = 'ENCUT = 520\nPREC = Accurate\nEDIFF = 1E-6';
      const parser = new VASPParser(content, 'INCAR');
      const result = parser.parseInput();
      expect(result.parameters.length).toBeGreaterThan(0);
    });

    it('should parse INCAR with comments', () => {
      const content = '# Energy cutoff\nENCUT = 520 # in eV';
      const parser = new VASPParser(content, 'INCAR');
      const result = parser.parseInput();
      expect(result.parameters).toBeDefined();
    });

    it('should handle empty INCAR', () => {
      const parser = new VASPParser('', 'INCAR');
      const result = parser.parseInput();
      expect(result.parameters).toEqual([]);
    });

    it('should parse POSCAR file', () => {
      const content =
        'Test structure\n1.0\n1.0 0.0 0.0\n0.0 1.0 0.0\n0.0 0.0 1.0\nH\n1\nDirect\n0.0 0.0 0.0';
      const parser = new VASPParser(content, 'POSCAR');
      const result = parser.parseInput();
      expect(result.parameters).toBeDefined();
    });

    it('should parse KPOINTS file', () => {
      const content = 'K-points\n0\nGamma\n4 4 4';
      const parser = new VASPParser(content, 'KPOINTS');
      const result = parser.parseInput();
      expect(result.parameters).toBeDefined();
    });

    it('should parse boolean values', () => {
      const parser = new VASPParser('LWAVE = .TRUE.\nLCHARG = .FALSE.', 'INCAR');
      const result = parser.parseInput();
      expect(result.parameters.find(p => p.name === 'LWAVE')?.value).toBe(true);
      expect(result.parameters.find(p => p.name === 'LCHARG')?.value).toBe(false);
    });

    it('should parse numeric values', () => {
      const parser = new VASPParser('ENCUT = 520.5', 'INCAR');
      const result = parser.parseInput();
      expect(result.parameters.find(p => p.name === 'ENCUT')?.value).toBe(520.5);
    });

    it('should handle malformed lines with warnings', () => {
      const parser = new VASPParser('ENCUT 520', 'INCAR'); // Missing =
      const result = parser.parseInput();
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validate', () => {
    it('should validate valid INCAR', () => {
      const parser = new VASPParser('ENCUT = 520', 'INCAR');
      const result = parser.validate();
      expect(result.valid).toBe(true);
    });

    it('should warn about missing ENCUT', () => {
      const parser = new VASPParser('PREC = Accurate', 'INCAR');
      const result = parser.validate();
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn about missing PREC', () => {
      const parser = new VASPParser('ENCUT = 520', 'INCAR');
      const result = parser.validate();
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should validate POSCAR with insufficient lines', () => {
      const parser = new VASPParser('Test', 'POSCAR');
      const result = parser.validate();
      expect(result.valid).toBe(false);
    });

    it('should validate KPOINTS with insufficient lines', () => {
      const parser = new VASPParser('K-points', 'KPOINTS');
      const result = parser.validate();
      expect(result.valid).toBe(false);
    });
  });

  describe('getSections', () => {
    it('should return sections', () => {
      const parser = new VASPParser('ENCUT = 520', 'INCAR');
      const sections = parser.getSections();
      expect(Array.isArray(sections)).toBe(true);
    });
  });

  describe('getParameters', () => {
    it('should return all parameters', () => {
      const parser = new VASPParser('ENCUT = 520\nPREC = Accurate', 'INCAR');
      const params = parser.getParameters();
      expect(Array.isArray(params)).toBe(true);
      expect(params.length).toBe(2);
    });
  });

  describe('getParameter', () => {
    it('should return specific parameter', () => {
      const parser = new VASPParser('ENCUT = 520', 'INCAR');
      const param = parser.getParameter('ENCUT');
      expect(param).toBeDefined();
      expect(param?.name).toBe('ENCUT');
    });

    it('should return undefined for non-existent parameter', () => {
      const parser = new VASPParser('ENCUT = 520', 'INCAR');
      const param = parser.getParameter('PREC');
      expect(param).toBeUndefined();
    });

    it('should be case-insensitive', () => {
      const parser = new VASPParser('ENCUT = 520', 'INCAR');
      const param = parser.getParameter('encut');
      expect(param).toBeDefined();
    });
  });

  describe('getSection', () => {
    it('should return section by name', () => {
      const parser = new VASPParser('ENCUT = 520', 'INCAR');
      const section = parser.getSection('INCAR');
      expect(section).toBeDefined();
    });

    it('should return undefined for non-existent section', () => {
      const parser = new VASPParser('ENCUT = 520', 'INCAR');
      const section = parser.getSection('NONEXISTENT');
      expect(section).toBeUndefined();
    });
  });
});

describe('GaussianParser', () => {
  describe('parseInput', () => {
    it('should parse simple Gaussian input', () => {
      const content = '# B3LYP/6-31G(d)\n\nTest\n\n0 1\nH 0 0 0';
      const parser = new GaussianParser(content);
      const result = parser.parseInput();
      expect(result.parameters).toBeDefined();
    });

    it('should parse Gaussian with multiple atoms', () => {
      const content =
        '# B3LYP/6-31G(d)\n\nWater\n\n0 1\nO 0.0 0.0 0.0\nH 0.96 0.0 0.0\nH -0.24 0.93 0.0';
      const parser = new GaussianParser(content);
      const result = parser.parseInput();
      expect(result.parameters).toBeDefined();
    });

    it('should parse Gaussian with route section keywords', () => {
      const content = '#p B3LYP/6-31G(d) opt freq\n\nTest\n\n0 1\nH 0 0 0';
      const parser = new GaussianParser(content);
      const result = parser.parseInput();
      expect(result.parameters).toBeDefined();
    });

    it('should handle empty input', () => {
      const parser = new GaussianParser('');
      const result = parser.parseInput();
      expect(result.parameters).toEqual([]);
    });

    it('should parse Link 0 commands', () => {
      const content = '%chk=test.chk\n# B3LYP/6-31G(d)\n\nTest\n\n0 1\nH 0 0 0';
      const parser = new GaussianParser(content);
      const result = parser.parseInput();
      expect(result.parameters.find(p => p.name === 'chk')).toBeDefined();
    });

    it('should extract method from route line', () => {
      const content = '# B3LYP/6-31G(d)\n\nTest\n\n0 1\nH 0 0 0';
      const parser = new GaussianParser(content);
      const result = parser.parseInput();
      expect(result.parameters.find(p => p.name === 'Method')?.value).toBe('B3LYP');
    });

    it('should extract basis from route line', () => {
      const content = '# B3LYP/6-31G(d)\n\nTest\n\n0 1\nH 0 0 0';
      const parser = new GaussianParser(content);
      const result = parser.parseInput();
      expect(result.parameters.find(p => p.name === 'Basis')?.value).toBe('6-31G(d)');
    });

    it('should extract calculation type from route line', () => {
      const content = '# B3LYP/6-31G(d) opt\n\nTest\n\n0 1\nH 0 0 0';
      const parser = new GaussianParser(content);
      const result = parser.parseInput();
      expect(result.parameters.find(p => p.name === 'CalculationType')?.value).toBe('opt');
    });

    it('should parse charge and multiplicity', () => {
      const content = '# B3LYP/6-31G(d)\n\nTest\n\n0 1\nH 0 0 0';
      const parser = new GaussianParser(content);
      const result = parser.parseInput();
      expect(result.parameters.find(p => p.name === 'Charge')?.value).toBe(0);
      expect(result.parameters.find(p => p.name === 'Multiplicity')?.value).toBe(1);
    });
  });

  describe('validate', () => {
    it('should validate valid Gaussian input', () => {
      const content = '# B3LYP/6-31G(d)\n\nTest\n\n0 1\nH 0 0 0';
      const parser = new GaussianParser(content);
      const result = parser.validate();
      expect(result.valid).toBe(true);
    });

    it('should detect missing route section', () => {
      const parser = new GaussianParser('Test\n\n0 1\nH 0 0 0');
      const result = parser.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect missing charge/multiplicity', () => {
      const parser = new GaussianParser('# B3LYP/6-31G(d)\n\nTest');
      const result = parser.validate();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getParameters', () => {
    it('should return all parameters', () => {
      const parser = new GaussianParser('# B3LYP/6-31G(d) opt\n\nTest\n\n0 1\nH 0 0 0');
      const params = parser.getParameters();
      expect(Array.isArray(params)).toBe(true);
    });
  });

  describe('getParameter', () => {
    it('should return specific parameter', () => {
      const parser = new GaussianParser('# B3LYP/6-31G(d)\n\nTest\n\n0 1\nH 0 0 0');
      const param = parser.getParameter('Method');
      expect(param).toBeDefined();
    });

    it('should return undefined for non-existent parameter', () => {
      const parser = new GaussianParser('# B3LYP/6-31G(d)\n\nTest\n\n0 1\nH 0 0 0');
      const param = parser.getParameter('nonexistent');
      expect(param).toBeUndefined();
    });
  });
});

describe('ORCAParser', () => {
  describe('parseInput', () => {
    it('should parse simple ORCA input', () => {
      const parser = new ORCAParser('! RHF def2-SVP\n\n* xyz 0 1\nH 0 0 0\n*');
      const result = parser.parseInput();
      expect(result.parameters).toBeDefined();
    });

    it('should handle empty input', () => {
      const parser = new ORCAParser('');
      const result = parser.parseInput();
      expect(result.parameters).toEqual([]);
    });
  });

  describe('validate', () => {
    it('should validate valid ORCA input', () => {
      const parser = new ORCAParser('! RHF def2-SVP\n\n* xyz 0 1\nH 0 0 0\n*');
      const result = parser.validate();
      expect(result).toHaveProperty('valid');
    });
  });
});

describe('CP2KParser', () => {
  describe('parseInput', () => {
    it('should parse simple CP2K input', () => {
      const parser = new CP2KParser('&GLOBAL\n  PROJECT_NAME test\n&END GLOBAL');
      const result = parser.parseInput();
      expect(result.parameters).toBeDefined();
    });

    it('should handle empty input', () => {
      const parser = new CP2KParser('');
      const result = parser.parseInput();
      expect(result.parameters).toEqual([]);
    });
  });

  describe('validate', () => {
    it('should validate valid CP2K input', () => {
      const parser = new CP2KParser('&GLOBAL\n  PROJECT_NAME test\n&END GLOBAL');
      const result = parser.validate();
      expect(result).toHaveProperty('valid');
    });
  });
});

describe('QEParser', () => {
  describe('parseInput', () => {
    it('should parse simple QE input', () => {
      const parser = new QEParser("&CONTROL\ncalculation = 'scf'\n/");
      const result = parser.parseInput();
      expect(result.parameters).toBeDefined();
    });

    it('should handle empty input', () => {
      const parser = new QEParser('');
      const result = parser.parseInput();
      expect(result.parameters).toEqual([]);
    });
  });

  describe('validate', () => {
    it('should validate valid QE input', () => {
      const parser = new QEParser("&CONTROL\ncalculation = 'scf'\n/");
      const result = parser.validate();
      expect(result).toHaveProperty('valid');
    });
  });
});

describe('GAMESSParser', () => {
  describe('parseInput', () => {
    it('should parse simple GAMESS input', () => {
      const parser = new GAMESSParser('$CONTRL RUNTYP=ENERGY $END');
      const result = parser.parseInput();
      expect(result.parameters).toBeDefined();
    });

    it('should handle empty input', () => {
      const parser = new GAMESSParser('');
      const result = parser.parseInput();
      expect(result.parameters).toEqual([]);
    });
  });

  describe('validate', () => {
    it('should validate valid GAMESS input', () => {
      const parser = new GAMESSParser('$CONTRL RUNTYP=ENERGY $END');
      const result = parser.validate();
      expect(result).toHaveProperty('valid');
    });
  });
});

describe('NWChemParser', () => {
  describe('parseInput', () => {
    it('should parse simple NWChem input', () => {
      const parser = new NWChemParser('geometry\n  H 0 0 0\nend');
      const result = parser.parseInput();
      expect(result.parameters).toBeDefined();
    });

    it('should handle empty input', () => {
      const parser = new NWChemParser('');
      const result = parser.parseInput();
      expect(result.parameters).toEqual([]);
    });
  });

  describe('validate', () => {
    it('should validate valid NWChem input', () => {
      const parser = new NWChemParser('geometry\n  H 0 0 0\nend');
      const result = parser.validate();
      expect(result).toHaveProperty('valid');
    });
  });
});
