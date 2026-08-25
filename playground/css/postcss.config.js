import fs from 'node:fs'
import path from 'node:path'
import postcssNested from 'postcss-nested'
import { globSync } from 'tinyglobby'
import { normalizePath } from 'vite'

export default {
  plugins: [
    postcssNested,
    testDirDep,
    testSourceInput,
    testInjectUrl,
    testInjectUrlOnceExit,
    testReplaceRoot,
  ],
}

/**
 * A plugin for testing the `dir-dependency` message handling.
 */
function testDirDep() {
  return {
    postcssPlugin: 'dir-dep',
    AtRule(atRule, { result, Comment }) {
      if (atRule.name === 'test') {
        const pattern = normalizePath(
          path.resolve(path.dirname(result.opts.from), './glob-dep/**/*.css'),
        )
        const files = globSync(pattern, { expandDirectories: false })
        const text = files.map((f) => fs.readFileSync(f, 'utf-8')).join('\n')
        atRule.parent.insertAfter(atRule, text)
        atRule.remove()

        result.messages.push({
          type: 'dir-dependency',
          plugin: 'dir-dep',
          dir: './glob-dep',
          glob: '*.css',
          parent: result.opts.from,
        })

        result.messages.push({
          type: 'dir-dependency',
          plugin: 'dir-dep',
          dir: './glob-dep/nested (dir)', // includes special characters in glob
          glob: '*.css',
          parent: result.opts.from,
        })
      }
    },
  }
}
testDirDep.postcss = true

function testSourceInput() {
  return {
    postcssPlugin: 'source-input',
    AtRule(atRule) {
      if (atRule.name === 'source-input') {
        atRule.after(
          `.source-input::before { content: ${JSON.stringify(
            atRule.source.input.from,
          )}; }`,
        )
        atRule.remove()
      }
    },
  }
}
testSourceInput.postcss = true

function testInjectUrl() {
  return {
    postcssPlugin: 'inject-url',
    Once(root, { Rule }) {
      root.walkAtRules('inject-url', (atRule) => {
        const rule = new Rule({
          selector: '.inject-url',
          source: atRule.source,
        })
        rule.append({
          prop: 'background',
          value: "url('=/ok.png')",
          source: atRule.source,
        })
        atRule.after(rule)
        atRule.remove()
      })
    },
  }
}
testInjectUrl.postcss = true

/**
 * A plugin for testing url() rewriting in content injected at OnceExit with
 * its own source file (like postcss-modules inlining composed files)
 */
function testInjectUrlOnceExit() {
  return {
    postcssPlugin: 'inject-url-once-exit',
    OnceExit(root, { postcss }) {
      root.walkAtRules('inject-url-once-exit', (atRule) => {
        atRule.remove()
        root.prepend(
          postcss.parse(
            '.inject-url-once-exit { background: url(./injected-bg.png) }',
            {
              from: path.join(
                import.meta.dirname,
                'injected-source/injected.css',
              ),
            },
          ),
        )
      })
    },
  }
}
testInjectUrlOnceExit.postcss = true

/**
 * A plugin for testing url() rewriting when a plugin replaces the whole tree
 * at OnceExit by reassigning `result.root` (like postcss-lightningcss or
 * @tailwindcss/vite do).
 */
function testReplaceRoot() {
  return {
    postcssPlugin: 'replace-root',
    OnceExit(root, { result, postcss }) {
      if (!root.some((node) => node.name === 'replace-root')) return
      // re-parse from scratch and hand back a brand new tree instead of
      // mutating `root`, the way postcss-lightningcss and @tailwindcss/vite
      // return their own output. `from` points at the source file so the
      // relative url has something to be rebased against.
      result.root = postcss.parse(
        '.replace-root { background: url(./replaced-bg.png) }',
        {
          from: path.join(
            import.meta.dirname,
            'replace-root-source/replaced.css',
          ),
        },
      )
    },
  }
}
testReplaceRoot.postcss = true
