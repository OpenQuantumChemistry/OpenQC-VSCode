import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'OpenQC-VSCode',
  description: 'Universal VS Code extension for quantum chemistry software',
  base: '/OpenQC-VSCode/',

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Configuration', link: '/guide/configuration' },
          ]
        },
        {
          text: 'Features',
          items: [
            { text: 'Syntax Highlighting', link: '/guide/syntax-highlighting' },
            { text: 'Code Completion', link: '/guide/code-completion' },
            { text: 'Visualization', link: '/guide/visualization' },
            { text: 'Validation', link: '/guide/validation' },
          ]
        },
        {
          text: 'Supported Software',
          items: [
            { text: 'CP2K', link: '/guide/cp2k' },
            { text: 'VASP', link: '/guide/vasp' },
            { text: 'Gaussian', link: '/guide/gaussian' },
            { text: 'ORCA', link: '/guide/orca' },
            { text: 'Quantum ESPRESSO', link: '/guide/qe' },
            { text: 'GAMESS', link: '/guide/gamess' },
            { text: 'NWChem', link: '/guide/nwchem' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/newtontech/OpenQC-VSCode' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 OpenQC Contributors'
    }
  }
})
