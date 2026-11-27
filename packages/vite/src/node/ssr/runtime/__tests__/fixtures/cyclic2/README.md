- `test1` - `test5`

Cyclic import example based on https://github.com/vitejs/vite/issues/14048#issuecomment-2354774156

```mermaid
flowchart TD
    B(dep1.js) -->|dep1| A(index.js)
    A -->|dep1| C(dep2.js)
    C -->|dep2| A
    A -->|dep1, dep2| entry.js
```

---

- `test6`

```mermaid
flowchart TD
    A(dep1.js) -->|dep1| B
    B(dep2.js) -->|dep2| A
    A -->|dep1| C(index.js)
```

---

- `test10` - `test11`

`export *` from a module that is still evaluating in a cycle (https://github.com/vitejs/vite/issues/24183).
`b.js` must also get the `value` export that `a.js` gets later through `export * from './leaf.js'`.
In `test11`, `b.js` re-exports `a.js` through `c.js`.

```mermaid
flowchart TD
    A(a.js) -->|export *| B(b.js)
    B -->|export *| A
    L(leaf.js) -->|value| A
    A -->|value| entry(index.js)
    B -->|value| entry
```
