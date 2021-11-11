// Generate flow charts with https://github.com/mermaid-js/mermaid

const ISSUE_WORKFLOW = `
graph TD
  A{Followed issue<br>template?}
    A -->|Yes| B{Is Duplicate?}
      B -->|Yes| D[Close and point to duplicate]
      B -->|No| E{Has proper<br>reproduction}
      E -->|Yes| F{Is actually<br>a bug?}
        F -->|Yes| H[Remove &quotpending triage&quot label<br>Add &quotbug&quot label<br>Add &quotrelated issue&quot label if applicable &#40e.g. &quotbug: ssr&quot or &quotplugin: vue&quot&#41]
        H --> I{Does the bug make<br>Vite unusable?}
          I -->|Yes| J{Does the bug<br>affect the majority<br>of users?}
          J -->|Yes| O[p5: urgent]
          J -->|No| P[p4: important]
          I -->|No| K{Are there<br>workarounds<br>for the bug?}
          K -->Q[p2: has workaround]
          K -->R[p3: minor bug]
        F -->|No| L{Is the behavior<br>intended?}
        L -->|Yes| M[Explain and close<br>Point to docs if needed]
        L -->|No| N[Keep open for discussion<br>Remove &quotpending triage&quot label]
      E -->|No| G[Label: &quotneeds reproduction&quot<br>Bot will auto close if no update has been made in 3 days]
    A -->|No| C[Close and ask to follow template]
`

const PR_WORKFLOW = `
graph TD
  A{Bug fix or<br>feature?}
    A -->|Bug fix| B{Is a &quotstrict fix&quot,<br>i.e. fixes an obvious<br>oversight with no<br>side effects?}
      B --> |Yes| D[- Verify the fix locally<br>- Review code quality<br>- Require test case if applicable<br>- Request changes if necessary]
        D --> F[Approve]
          F --> G[Merge if approved by<br>2 or more team members<br>- Use &quotSquach and Merge&quot<br>- Edit commit message to follow<br>convention<br>- In commit message body, list<br>relevant issues being fixed<br>e.g. &quotfix #1234, fix #1235&quot]
      B --> |No| E[Discuss the potential side<br>effects of the fix, e.g.<br>- Could it introduce implicit<br>behavior changes in other<br>cases?<br>- Does it introduce too much<br>changes?]
        E --> H[Add priority labels<br>&#40see issue triaging workflow&#41]
          H --> I[Await input from Evan]
            I --> D
    A -->|Feature| C[- Discuss feature necessity<br>- Is this the best way to<br>address the need?<br>- Review code quality<br>- Add feature labels<br>- Approve if you feel strongly<br>that the feature is needed]
      C --> J[Await input from Evan]
        J --> G
`

generate()

function generate() {
  const http = require('https')
  const path = require('path')
  const fs = require('fs')

  const charts = {
    'issue-workflow': ISSUE_WORKFLOW,
    'pr-workflow': PR_WORKFLOW
  }

  for (let [name, code] of Object.entries(charts)) {
    const config = JSON.stringify({ code, mermaid: { theme: 'default' } })
    const encoded = Buffer.from(config, 'utf8').toString('base64')
    const url = `https://mermaid.ink/img/${encodeURIComponent(encoded)}`
    const destination = path.resolve(__dirname, `../.github/${name}.jpg`)

    http.get(url, (res) => res.pipe(fs.createWriteStream(destination)))
  }
}
