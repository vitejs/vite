## Git Commit Message Convention

> This is adapted from [Angular's commit convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular).

#### TL;DR:

Messages must be matched by the following regex:

<!-- prettier-ignore -->
```js
/^(revert: )?(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\(.+\))?!?: .{1,50}/
```

#### Examples

```
feat(dev): add 'comments' option
fix(dev): fix dev error
perf(build)!: remove 'foo' option
revert: feat(compiler): add 'comments' option
```

### Revert

If the PR reverts a previous commit, it should begin with `revert: `, followed by the header of the reverted commit

### Scope

The scope could be anything specifying the place of the commit change. For example `dev`, `build`, `workflow`, `cli` etc...

### Subject

The subject contains a succinct description of the change:

- use the imperative, present tense: "change" not "changed" nor "changes"
- don't capitalize the first letter
- no dot (.) at the end
