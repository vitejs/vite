import type { CSSModulesConfig, Drafts, Targets } from 'lightningcss'

/*
 Using a namespace create issue once bundled because definition are not inlined,
 and it creates types like `export type Drafts = Drafts`
*/

export type LightningCSS = {
  CSSModulesConfig: CSSModulesConfig
  Drafts: Drafts
  Targets: Targets
}
