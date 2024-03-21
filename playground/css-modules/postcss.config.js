import path from 'node:path'
import postcss from 'postcss'

export default {
  plugins: [
    /**
     * PostCSS plugin that adds a "--file" CSS variable to indicate PostCSS
     * has been successfully applied
     */
    (root) => {
      const newRule = postcss.rule({ selector: ':root' })
      newRule.append({
        prop: '--file',
        value: JSON.stringify(path.basename(root.source.input.file)),
      })
      root.append(newRule)
    },
  ],
}
