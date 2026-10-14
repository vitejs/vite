# Agent HMR gate

Enable the gate with `experimental.agentHmrGate`. This playground contains its
agent hook setup and integration test.

This playground treats one agent turn as one preview transaction:

1. `UserPromptSubmit` posts to `/__agent_hmr/begin`.
2. Vite continues watching, invalidating modules, and computing HMR payloads,
   but the plugin queues `update`, `full-reload`, `prune`, and `error` messages.
3. `Stop` posts to `/__agent_hmr/flush`. The gate waits for 100 ms without a new
   payload before committing. Codex `Interrupt` also flushes so a cancelled turn
   cannot leave the gate holding.
4. The plugin merges granular updates into one message. It preserves addressed
   full-reload messages, while a prune forces a wildcard reload. A final
   unresolved build error is shown only after the flush.

In bundled-dev mode, Rolldown sends per-client patch payloads instead of running
Vite's `hotUpdate` hook. The gate queues those payloads per client and releases
them as one batch on flush. The client loads every patch, then computes and
applies one combined HMR update.

Run the playground:

```sh
pnpm --dir playground/agent-hmr-gate dev
```

The hook helper defaults to `http://127.0.0.1:5173`. Set `AGENT_HMR_URL` if the
server uses a different origin. Connection failures are ignored so prompts still
work while Vite is stopped.

For Codex, copy `hooks/codex-hooks.json` to `.codex/hooks.json`, restart Codex,
and approve the project hooks with `/hooks`. For Claude Code, merge
`hooks/claude-settings.json` into `.claude/settings.json`.

The gate sends one merged granular update for ordinary module edits and reloads
held changes that Vite cannot hot-update. Config, config-dependency, and `.env`
edits still restart Vite immediately because Vite handles them before plugin
`hotUpdate` hooks run.
