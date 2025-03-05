import Application from '@ember/application'
import Resolver from 'ember-resolver'
import config from '#config'
import { macroCondition, isDevelopingApp, importSync } from '@embroider/macros'

import { registry } from './registry.js'

if (macroCondition(isDevelopingApp())) {
  importSync('./deprecation-workflow')
}

export default class App extends Application {
  modulePrefix = config.modulePrefix
  Resolver = Resolver.withModules(registry)
}
