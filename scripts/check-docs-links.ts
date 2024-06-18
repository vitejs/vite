import { readFileSync } from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import glob from 'fast-glob'
import colors from 'picocolors'

interface Link {
  text: string
  url: string
  file: string
  statusCode?: number
}
const ignorePatterns: RegExp[] = [/viteconf\.org/, /twitter\.com/]
const linkRegex = /\[(.*?)\]\((https?:\/\/.*?)\)/g
const links: Link[] = []

function startsWith4or5(num: number) {
  const strNum = num.toString()
  return strNum.startsWith('4') || strNum.startsWith('5')
}

function checkLink(
  url: string,
): Promise<{ url: string; statusCode: number | null | undefined }> {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http
    const request = protocol.request(url, { method: 'HEAD' }, (response) => {
      resolve({ url, statusCode: response.statusCode })
    })

    request.on('error', () => resolve({ url, statusCode: null }))
    request.setTimeout(10000, () => {
      request.destroy()
      resolve({ url, statusCode: null })
    })
    request.end()
  })
}

async function readDocs() {
  const brokenLinks: Link[] = []
  const files = await glob('docs/**/*.md', {
    ignore: ['**/node_modules/**'],
    absolute: true,
    onlyFiles: true,
  })

  for (const file of files) {
    const markdownText = readFileSync(file, 'utf-8')
    let match: RegExpExecArray | null
    while ((match = linkRegex.exec(markdownText)) != null) {
      const shouldIgnore = ignorePatterns.some((pattern) =>
        pattern.test(match![2]),
      )
      if (!shouldIgnore) {
        links.push({ text: match[1], url: match[2], file: file })
      }
    }
  }

  console.log(`Found ${links.length} links in ${files.length} files.`)
  console.time('readDocs')

  const checkLinkPromises = links.map((link) => checkLink(link.url))
  const results = await Promise.all(checkLinkPromises)

  results.forEach((result, index) => {
    const link = links[index]
    if (
      typeof result.statusCode === 'number' &&
      startsWith4or5(result.statusCode)
    ) {
      brokenLinks.push({ ...link, statusCode: result.statusCode })
    }
  })

  if (brokenLinks.length === 0) {
    console.log(colors.green('All links are accessible.'))
  } else {
    console.log(colors.red(`Found ${brokenLinks.length} broken links:`))
    brokenLinks.forEach((link) => {
      console.log(
        colors.yellow(
          `[${link.text}](${link.url}) with status code ${link.statusCode}`,
        ),
      )
    })
    process.exit(1)
  }
  console.timeEnd('readDocs')
}

readDocs()
