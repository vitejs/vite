const fs = require('fs')
const path = require('path')

/**
 * @param {{timing: number, hooks: string}[]} oRecord
 * @param {{timing: number, hooks: string}[]} nRecord
 */
function formatComment(oRecord, nRecord) {
  /** @param {Record<string, {timing: number, hooks: string}} record */
  const total = (record) =>
    Object.values(record).reduce((sum, info) => (sum += info.timing), 0)

  /**
   * @param {Record<string, {timing: number, hooks: string}} o
   * @param {Record<string, {timing: number, hooks: string}} n
   * @return {[string, {timing: number, hooks: string, diff: number}][]}
   */
  const diffRecord = (o, n) => {
    return Object.entries(n).map(([key, val]) => {
      val.diff = val.timing - (o[key].timing || 0)
      return [key, val]
    })
  }

  const formatDiff = (diff) => `${diff > 0 ? `+` : `-`}${diff}`

  /**
   * @param {Record<string, {timing: number, hooks: string}} o
   * @param {Record<string, {timing: number, hooks: string}} n
   * @param {(a: {timing: number diff: number}, b: {timing: number diff: number}) => boolean} sortFn
   */
  const formatTable = (o, n, sortFn) => {
    return diffRecord(o, n)
      .sort((a, b) => sortFn(a[1], b[1]))
      .slice(0, 5)
      .map(
        ([key, val]) =>
          `|${val.hooks}|${key}|${val.timing}|${formatDiff(val.diff)}|`
      )
      .join('\n')
  }

  const nTotalServe = total(nRecord.serve)
  const nTotalBuild = total(nRecord.build)

  return [
    '<!--report-->',
    '## ⏰ unit test used vite time',
    `serve total: ${nTotalServe}ms`,
    `build total: ${nTotalBuild}ms`,
    `serve total diff: ${formatDiff(nTotalServe - total(oRecord.serve))}ms`,
    `build total diff: ${formatDiff(nTotalBuild - total(oRecord.build))}ms`,
    `\n<details><summary> Toggle detail... </summary>`,
    '\n### 🗒️ Top 5 (server diff)\n',
    '|hooks|file|timing(ms)|diff(ms)|',
    '|-----|----|----------|--------|',
    formatTable(oRecord.serve, nRecord.serve, (a, b) => b.diff - a.diff),
    '\n### 🗒️ Top 5 (build diff)\n',
    '|hooks|file|timing(ms)|diff(ms)|',
    '|-----|----|----------|--------|',
    formatTable(oRecord.build, nRecord.build, (a, b) => b.diff - a.diff),
    `\n</details>`
  ].join('\n')
}

module.exports = async function action(github, context) {
  const cache = {
    serve: require('../report.serve.json'),
    build: require('../report.build.json')
  }
  const res = {
    serve: require('../new.report.serve.json'),
    build: require('../new.report.build.json')
  }
  const comment = {
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body: formatComment(cache, res)
  }
  let commentId
  const comments = (
    await github.rest.issues.listComments({
      ...context.repo,
      issue_number: context.issue.number
    })
  ).data
  for (const c of comments) {
    if (c.user.type === 'Bot' && c.body.includes('<!--report-->')) {
      commentId = c.id
      break
    }
  }
  if (commentId) {
    await github.rest.issues.updateComment({
      comment_id: commentId,
      ...comment
    })
  } else {
    await github.rest.issues.createComment(comment)
  }
}
