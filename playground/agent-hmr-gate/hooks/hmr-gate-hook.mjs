const action = process.argv[2]
if (action !== 'begin' && action !== 'flush') {
  throw new Error(
    `expected "begin" or "flush", received ${JSON.stringify(action)}`,
  )
}

// Hook input is not needed, but consuming it avoids closing the pipe early.
for await (const _chunk of process.stdin) {
  // no-op
}

const baseUrl = (process.env.AGENT_HMR_URL ?? 'http://127.0.0.1:5173').replace(
  /\/$/,
  '',
)

try {
  const response = await fetch(`${baseUrl}/__agent_hmr/${action}`, {
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error(`Vite responded with ${response.status}`)
  }
} catch {
  // Vite may not be running for every agent turn.
}

// Both Codex and Claude Code accept an empty successful hook result.
process.stdout.write('{}\n')
