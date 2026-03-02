import * as assert from 'assert';
import { CP2KParser } from '../../../parsers/CP2KParser';

suite('CP2KParser Tests', () => {
    test('should parse basic CP2K input', () => {
        const content = `
&GLOBAL
  PROJECT_NAME test
  RUN_TYPE ENERGY
&END GLOBAL

&FORCE_EVAL
  METHOD Quickstep
  &DFT
    BASIS_SET_FILE_NAME BASIS_SET
    POTENTIAL_FILE_NAME POTENTIAL
  &END DFT
&END FORCE_EVAL
`;
        const parser = new CP2KParser(content);
        const result = parser.parseInput();

        assert.strictEqual(result.sections.length, 2);
        assert.strictEqual(result.errors.length, 0);

        const globalSection = parser.getSection('GLOBAL');
        assert.ok(globalSection);
        
        const project = parser.getParameter('PROJECT_NAME');
        assert.ok(project);
        assert.strictEqual(project?.value, 'test');
    });

    test('should detect unclosed sections', () => {
        const content = `
&GLOBAL
  PROJECT_NAME test
  RUN_TYPE ENERGY
`;
        const parser = new CP2KParser(content);
        const result = parser.parseInput();

        assert.ok(result.errors.length > 0);
        assert.ok(result.errors.some(e => e.message.includes('not properly closed')));
    });

    test('should validate required sections', () => {
        const content = `
&GLOBAL
  PROJECT_NAME test
  RUN_TYPE ENERGY
&END GLOBAL
`;
        const parser = new CP2KParser(content);
        const validation = parser.validate();

        assert.strictEqual(validation.valid, false);
        assert.ok(validation.errors.some(e => e.message.includes('FORCE_EVAL')));
    });

    test('should convert boolean values', () => {
        const content = `
&GLOBAL
  PROJECT_NAME test
  RUN_TYPE ENERGY
  PRINT_LEVEL on
&END GLOBAL

&FORCE_EVAL
  METHOD Quickstep
&END FORCE_EVAL
`;
        const parser = new CP2KParser(content);
        const result = parser.parseInput();

        const printLevel = parser.getParameter('PRINT_LEVEL');
        assert.ok(printLevel);
        assert.strictEqual(printLevel?.value, true);
    });

    test('should parse nested sections', () => {
        const content = `
&FORCE_EVAL
  METHOD Quickstep
  &DFT
    &SCF
      SCF_GUESS ATOMIC
    &END SCF
  &END DFT
&END FORCE_EVAL
`;
        const parser = new CP2KParser(content);
        const result = parser.parseInput();

        const forceEval = parser.getSection('FORCE_EVAL');
        assert.ok(forceEval);
        assert.ok(forceEval?.subsections);
        assert.strictEqual(forceEval?.subsections?.length, 1);
    });
});
