/**
 * OpenQC-VSCode LSP Providers
 * Language Server Protocol providers for quantum chemistry input files
 */

export { CompletionProvider } from './CompletionProvider';
export { DiagnosticsProvider } from './DiagnosticsProvider';
export { HoverProvider } from './HoverProvider';
export { DefinitionProvider } from './DefinitionProvider';

import { CompletionProvider } from './CompletionProvider';
import { DiagnosticsProvider } from './DiagnosticsProvider';
import { HoverProvider } from './HoverProvider';
import { DefinitionProvider } from './DefinitionProvider';

export interface LSPProviders {
  completion: CompletionProvider;
  diagnostics: DiagnosticsProvider;
  hover: HoverProvider;
  definition: DefinitionProvider;
}

export function createLSPProviders(): LSPProviders {
  return {
    completion: new CompletionProvider(),
    diagnostics: new DiagnosticsProvider(),
    hover: new HoverProvider(),
    definition: new DefinitionProvider(),
  };
}
