import type {
  CSSModulesConfig,
  Drafts,
  Features,
  NonStandard,
  PseudoClasses,
  Targets,
} from 'lightningcss'

/**
 * Options are spread, so you can also use options that are not typed here like
 * visitor (not exposed because it would impact too much the bundle size)
 */
export type LightningCSSOptions = {
  targets?: Targets
  include?: Features
  exclude?: Features
  drafts?: Drafts
  nonStandard?: NonStandard
  pseudoClasses?: PseudoClasses
  unusedSymbols?: string[]
  cssModules?: CSSModulesConfig
}
