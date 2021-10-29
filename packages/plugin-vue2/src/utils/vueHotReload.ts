export const vueHotReloadCode = `
var Vue // late bind
var version
var __VUE_HMR_RUNTIME__ = Object.create(null)
var map = Object.create(null)
if (typeof window !== 'undefined') {
	window.__VUE_HMR_RUNTIME__ = __VUE_HMR_RUNTIME__
}
var installed = false
var isBrowserify = false
var initHookName = 'beforeCreate'

__VUE_HMR_RUNTIME__.install = function (vue, browserify) {
	if (installed) { return }
	installed = true

	Vue = vue.__esModule ? vue.default : vue
	version = Vue.version.split('.').map(Number)
	isBrowserify = browserify

	// compat with < 2.0.0-alpha.7
	if (Vue.config._lifecycleHooks.indexOf('init') > -1) {
		initHookName = 'init'
	}

	__VUE_HMR_RUNTIME__.compatible = version[0] >= 2
	if (!__VUE_HMR_RUNTIME__.compatible) {
		console.warn(
			'[HMR] You are using a version of vue-hot-reload-api that is ' +
			'only compatible with Vue.js core ^2.0.0.'
		)
		return
	}
}

/**
 * Create a record for a hot module, which keeps track of its constructor
 * and instances
 *
 * @param {String} id
 * @param {Object} options
 */

__VUE_HMR_RUNTIME__.createRecord = function (id, options) {
	if(map[id]) { return }

	var Ctor = null
	if (typeof options === 'function') {
		Ctor = options
		options = Ctor.options
	}
	makeOptionsHot(id, options)
	map[id] = {
		Ctor: Ctor,
		options: options,
		instances: []
	}
}

/**
 * Check if module is recorded
 *
 * @param {String} id
 */

__VUE_HMR_RUNTIME__.isRecorded = function (id) {
	return typeof map[id] !== 'undefined'
}

/**
 * Make a Component options object hot.
 *
 * @param {String} id
 * @param {Object} options
 */

function makeOptionsHot(id, options) {
	if (options.functional) {
		var render = options.render
		options.render = function (h, ctx) {
			var instances = map[id].instances
			if (ctx && instances.indexOf(ctx.parent) < 0) {
				instances.push(ctx.parent)
			}
			return render(h, ctx)
		}
	} else {
		injectHook(options, initHookName, function() {
			var record = map[id]
			if (!record.Ctor) {
				record.Ctor = this.constructor
			}
			record.instances.push(this)
		})
		injectHook(options, 'beforeDestroy', function() {
			var instances = map[id].instances
			instances.splice(instances.indexOf(this), 1)
		})
	}
}

/**
 * Inject a hook to a hot reloadable component so that
 * we can keep track of it.
 *
 * @param {Object} options
 * @param {String} name
 * @param {Function} hook
 */

function injectHook(options, name, hook) {
	var existing = options[name]
	options[name] = existing
		? Array.isArray(existing) ? existing.concat(hook) : [existing, hook]
		: [hook]
}

function tryWrap(fn) {
	return function (id, arg) {
		try {
			fn(id, arg)
		} catch (e) {
			console.error(e)
			console.warn(
				'Something went wrong during Vue component hot-reload. Full reload required.'
			)
		}
	}
}

function updateOptions (oldOptions, newOptions) {
	for (var key in oldOptions) {
		if (!(key in newOptions)) {
			delete oldOptions[key]
		}
	}
	for (var key$1 in newOptions) {
		oldOptions[key$1] = newOptions[key$1]
	}
}

__VUE_HMR_RUNTIME__.rerender = tryWrap(function (id, options) {
	var record = map[id]
	if (!options) {
		record.instances.slice().forEach(function (instance) {
			instance.$forceUpdate()
		})
		return
	}	
	if (typeof options === 'function') {
		options = options.options
	}
	if(record.functional){
		record.render = options.render
		record.staticRenderFns = options.staticRenderFns
		__VUE_HMR_RUNTIME__.reload(id, record)
		return
	}
	if (record.Ctor) {
		record.Ctor.options.render = options.render
		record.Ctor.options.staticRenderFns = options.staticRenderFns
		record.instances.slice().forEach(function (instance) {
			instance.$options.render = options.render
			instance.$options.staticRenderFns = options.staticRenderFns
			// reset static trees
			// pre 2.5, all static trees are cached together on the instance
			if (instance._staticTrees) {
				instance._staticTrees = []
			}
			// 2.5.0
			if (Array.isArray(record.Ctor.options.cached)) {
				record.Ctor.options.cached = []
			}
			// 2.5.3
			if (Array.isArray(instance.$options.cached)) {
				instance.$options.cached = []
			}

			// post 2.5.4: v-once trees are cached on instance._staticTrees.
			// Pure static trees are cached on the staticRenderFns array
			// (both already reset above)

			// 2.6: temporarily mark rendered scoped slots as unstable so that
			// child components can be forced to update
			var restore = patchScopedSlots(instance)
			instance.$forceUpdate()
			instance.$nextTick(restore)
		})
	} else {
		// functional or no instance created yet
		record.options.render = options.render
		record.options.staticRenderFns = options.staticRenderFns

		// handle functional component re-render
		if (record.options.functional) {
			// rerender with full options
			if (Object.keys(options).length > 2) {
				updateOptions(record.options, options)
			} else {
				// template-only rerender.
				// need to inject the style injection code for CSS modules
				// to work properly.
				var injectStyles = record.options._injectStyles
				if (injectStyles) {
					var render = options.render
					record.options.render = function (h, ctx) {
						injectStyles.call(ctx)
						return render(h, ctx)
					}
				}
			}
			record.options._Ctor = null
			// 2.5.3
			if (Array.isArray(record.options.cached)) {
				record.options.cached = []
			}
			record.instances.slice().forEach(function (instance) {
				instance.$forceUpdate()
			})
		}
	}
})

__VUE_HMR_RUNTIME__.reload = tryWrap(function (id, options) {
	var record = map[id]
	if (options) {
		if (typeof options === 'function') {
			options = options.options
		}
		makeOptionsHot(id, options)
		if (record.Ctor) {
			if (version[1] < 2) {
				// preserve pre 2.2 behavior for global mixin handling
				record.Ctor.extendOptions = options
			}
			var newCtor = record.Ctor.super.extend(options)
			// prevent record.options._Ctor from being overwritten accidentally
			newCtor.options._Ctor = record.options._Ctor
			record.Ctor.options = newCtor.options
			record.Ctor.cid = newCtor.cid
			record.Ctor.prototype = newCtor.prototype
			if (newCtor.release) {
				// temporary global mixin strategy used in < 2.0.0-alpha.6
				newCtor.release()
			}
		} else {
			updateOptions(record.options, options)
		}
	}
	record.instances.slice().forEach(function (instance) {
		if (instance.$vnode && instance.$vnode.context) {
			instance.$vnode.context.$forceUpdate()
		} else {
			console.warn(
				'Root or manually mounted instance modified. Full reload required.'
			)
		}
	})
})

// 2.6 optimizes template-compiled scoped slots and skips updates if child
// only uses scoped slots. We need to patch the scoped slots resolving helper
// to temporarily mark all scoped slots as unstable in order to force child
// updates.
function patchScopedSlots (instance) {
	if (!instance._u) { return }
	// https://github.com/vuejs/vue/blob/dev/src/core/instance/render-helpers/resolve-scoped-slots.js
	var original = instance._u
	instance._u = function (slots) {
		try {
			// 2.6.4 ~ 2.6.6
			return original(slots, true)
		} catch (e) {
			// 2.5 / >= 2.6.7
			return original(slots, null, true)
		}
	}
	return function () {
		instance._u = original
	}
}
export default __VUE_HMR_RUNTIME__
`
