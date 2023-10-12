import type { Plugin } from 'vite'

export const commentSourceMap =
  '//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHIn0='

export default function transformFooWithInlineSourceMap(): Plugin {
  return {
    name: 'transform-foo-with-inline-sourcemap',
    transform(code, id) {
      if (id.includes('foo-with-sourcemap.js')) {
        return `${code}\n${commentSourceMap}`
      }
    },
  }
}
