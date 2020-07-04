import { resolver } from './resolver'
import { vuePlugin } from './serverPlugin'
// import { reactRefreshTransform } from './transform'

export = {
	resolvers: [resolver],
	configureServer: vuePlugin,
	// transforms: [reactRefreshTransform]
}
