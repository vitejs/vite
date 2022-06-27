/* eslint-disable node/no-missing-require */
const fs = require('fs')
const path = require('path')

function formatComment(record) {
  const formatJSON = (json) => {
    return Object.entries(record.serve)
      .sort((a, b) => b[1].timing - a[1].timing)
      .slice(0, 5)
      .map((dat) => `|${dat[1].hooks}|${dat[0]}|${dat[1].timing}|`)
      .join('\n')
  }

  const total = (json) => {
    return Object.values(record.serve).reduce(
      (sum, info) => (sum += info.timing),
      0
    )
  }

  return [
    '<!--report-->',
    `total(serve): ${total(record.serve)}ms`,
    `total(build): ${total(record.build)}ms`,
    `<details><summary> Toggle detail... </summary>`,
    '\n## Top 5 (server)\n',
    '|hooks|file|timing|',
    '|-----|----|------|',
    formatJSON(record.serve),
    '\n## Top 5 (build)\n',
    '|hooks|file|timing|',
    '|-----|----|------|',
    formatJSON(record.build),
    `\n</details>`
  ].join('\n')
}

module.exports = async function action(github, context) {
  const res = {
    serve: require('../report.serve.json'),
    build: require('../report.build.json')
  }
  const comment = {
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body: formatComment(res)
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
