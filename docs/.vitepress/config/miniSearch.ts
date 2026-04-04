// Reference: https://github.com/vuejs/vitepress/blob/cb8f5531ce34ce35008ef5043ffaa39e2a2f9c38/src/node/plugins/localSearchPlugin.ts

import path from 'node:path'

// eslint-disable-next-line regexp/no-super-linear-backtracking
const headingRegex = /<h(\d*).*?>(.*?<a.*? href="#.*?".*?>.*?<\/a>)<\/h\1>/gi
// eslint-disable-next-line regexp/no-super-linear-backtracking
const headingContentRegex = /(.*)<a.*? href="#(.*?)".*?>.*?<\/a>/i

const blogDir = path.resolve(import.meta.dirname, '../../blog')

export function* splitIntoSections(file: string, html: string) {
  // Do not index blog posts
  if (file.startsWith(blogDir)) return
  yield* baseSplitPageIntoSections(html)
}

/**
 * Splits HTML into sections based on headings
 */
function* baseSplitPageIntoSections(html: string) {
  const result = html.split(headingRegex)
  result.shift()
  let parentTitles: string[] = []
  for (let i = 0; i < result.length; i += 3) {
    const level = parseInt(result[i]) - 1
    const heading = result[i + 1]
    const headingResult = headingContentRegex.exec(heading)
    const title = clearHtmlTags(headingResult?.[1] ?? '').trim()
    const anchor = headingResult?.[2] ?? ''
    const content = result[i + 2]
    if (!title || !content) continue
    let titles = parentTitles.slice(0, level)
    titles[level] = title
    titles = titles.filter(Boolean)
    yield { anchor, titles, text: getSearchableText(content) }
    if (level === 0) {
      parentTitles = [title]
    } else {
      parentTitles[level] = title
    }
  }
}

function getSearchableText(content: string) {
  content = clearHtmlTags(content)
  return content
}

function clearHtmlTags(str: string) {
  return str.replace(/<[^>]*>/g, '')
}
