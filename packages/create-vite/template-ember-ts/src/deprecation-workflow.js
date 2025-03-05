// NOTE: https://github.com/ember-cli/ember-cli-deprecation-workflow/issues/208
import setupDeprecationWorkflow from 'ember-cli-deprecation-workflow/addon/index'

/**
 * You may also generate the contents for this via
 *
 *   deprecationWorkflow.flushDeprecations()
 *
 * in the browser console
 */
setupDeprecationWorkflow({
  /**
   * Set to true to throw on any new deprecation so that you must resolve
   */
  throwOnUnhandled: false,
  workflow: [
    // Example
    //{ handler: 'silence', matchId: 'template-action' },
  ],
})
