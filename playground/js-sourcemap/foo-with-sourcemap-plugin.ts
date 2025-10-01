import type { Plugin } from 'vite'

export const commentSourceMap = [
  '// default boundary sourcemap with magic-string',
  '//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHIn0=',
].join('\n')

export default function transformFooWithInlineSourceMap(): Plugin {
  return {
    name: 'transform-foo-with-inline-sourcemap',
    transform(code, id) {
      if (id.includes('foo-with-sourcemap.js')) {
        return `${code}${commentSourceMap}`
      }
    },
  }
}
