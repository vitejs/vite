// use by actions/github-script
const fs = require('fs')
const path = require('path')

module.exports = async function action(github, context) {
  const comment = {
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body: fs.readFileSync(path.resolve('./report.md'), { encoding: 'utf-8' })
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
