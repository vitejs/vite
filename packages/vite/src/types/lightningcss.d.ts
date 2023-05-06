import type { CSSModulesConfig, Drafts, Targets } from 'lightningcss'

/*
 Using a namespace create issue once bundled because definition are nor inlined,
 and it creates types like `export type Drafts = Drafts`
*/

export type LightningCSSModulesConfig = CSSModulesConfig
export type LightningCSSDrafts = Drafts
export type LightningCSSTargets = Targets
