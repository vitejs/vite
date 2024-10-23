import type {
  CSSModulesConfig,
  Drafts,
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
  include?: number
  exclude?: number
  drafts?: Drafts
  nonStandard?: NonStandard
  pseudoClasses?: PseudoClasses
  unusedSymbols?: string[]
  cssModules?: CSSModulesConfig
  errorRecovery?: boolean
}
