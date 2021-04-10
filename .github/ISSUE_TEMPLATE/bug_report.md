---
name: "\U0001F41E Bug report"
about: Report an issue with Vite
title: ''
labels: 'bug: pending triage'
assignees: ''
---

<!-- 中文用户请注意：请仔细阅读以下模版，如果不遵循模版，issue 将会被直接关闭。 -->
<!--
  !!! IMPORTANT !!!
  Please do not ignore this template. If you do, your issue will be closed immediately.
-->

### Describe the bug

<!-- A clear and concise description of what the bug is. -->

<!-- If you intend to submit a PR for this issue, tell us in the description. Thanks! -->

### Reproduction

<!--
  Please provide a link to a repo that can reproduce the problem you ran into.

  A reproduction is required unless you are absolutely sure that the issue is obvious and the provided information is enough to understand the problem. If a report is vague (e.g. just a generic error message) and has no reproduction, it will receive a "need reproduction" label. If no reproduction is provided after 3 days, it will be auto-closed.
-->

### System Info

Output of `npx envinfo --system --npmPackages vite,@vitejs/plugin-vue --binaries --browsers`:

```node

```

Used package manager: <!-- npm | yarn | pnpm -->

### Logs <!-- (Optional if provided reproduction) -->

<!--
  Please try not to insert an image but copy paste the log text.

  1. Run `vite` or `vite build` with the `--debug` flag.
  2. Provide the error log here.
     `node` is used as highlight to improve some colors in stack-traces.
     If it doesn't work quite well, try `console`.
-->

```node

```

---

### Before submitting the issue, please make sure you do the following

- [ ] Read the [Contributing Guidelines](https://github.com/vitejs/vite/blob/main/.github/contributing.md).
- [ ] Read the [docs](https://vitejs.dev/guide).
- [ ] Check that there isn't already an issue that reports the same bug to avoid creating a duplicate.
- [ ] Provide a description in this issue that describes the bug.
- [ ] Make sure this is a Vite issue and not a framework-specific issue. For example, if it's a Vue SFC related bug, it should likely be reported to https://github.com/vuejs/vue-next instead.
- [ ] Check that this is a concrete bug. For Q&A open a [GitHub Discussion](https://github.com/vitejs/vite/discussions) or join our [Discord Chat Server](https://chat.vitejs.dev/).
