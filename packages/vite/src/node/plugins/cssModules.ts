import type{ Plugin } from "../plugin";
import type { ResolvedConfig } from "../config";

export function cssModulesPlugin(config: ResolvedConfig): Plugin {
  return {
    name: 'vite:css-modules',

  }
}