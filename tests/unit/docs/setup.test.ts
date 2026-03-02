import * as fs from 'fs';
import * as path from 'path';

describe('Documentation Framework', () => {
  const rootDir = path.resolve(__dirname, '../../../');
  const docsDir = path.join(rootDir, 'docs');
  const packageJsonPath = path.join(rootDir, 'package.json');

  describe('Vitepress Configuration', () => {
    it('should have vitepress installed as devDependency', () => {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.devDependencies).toHaveProperty('vitepress');
    });

    it('should have docs:dev script', () => {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.scripts).toHaveProperty('docs:dev');
    });

    it('should have docs:build script', () => {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.scripts).toHaveProperty('docs:build');
    });

    it('should have vitepress config file', () => {
      const configPath = path.join(docsDir, '.vitepress/config.ts');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should have docs index.md', () => {
      const indexPath = path.join(docsDir, 'index.md');
      expect(fs.existsSync(indexPath)).toBe(true);
    });

    it('should have proper vitepress config structure', () => {
      const configPath = path.join(docsDir, '.vitepress/config.ts');
      const configContent = fs.readFileSync(configPath, 'utf-8');
      expect(configContent).toContain('title');
      expect(configContent).toContain('description');
      expect(configContent).toContain('themeConfig');
    });
  });

  describe('Documentation Content', () => {
    it('should have guide directory', () => {
      const guideDir = path.join(docsDir, 'guide');
      expect(fs.existsSync(guideDir)).toBe(true);
    });

    it('should have getting started guide', () => {
      const gettingStartedPath = path.join(docsDir, 'guide', 'getting-started.md');
      expect(fs.existsSync(gettingStartedPath)).toBe(true);
    });
  });
});
