# aw-ext-effort-inline

An [Agent Wrangler](https://github.com/alex-pezarro-portswigger/agent-wrangler) extension
that moves the dispatch modal's **Effort** picker out of *Advanced options* and puts it
**side by side with the model selector** — two half-width columns on one row.

Uses the `dispatch.field` client slot (host API `^1.9.0`):

- `hideDispatchField: ['effort']` in the manifest discloses that it may suppress the core
  effort row; the contribution's `hides: ['effort']` is the actual use.
- Hiding is presentation only, so the contribution's `fields()` writes `effort` back into
  the dispatch payload — otherwise the invisible core select's value would be sent.
- The effort vocabulary is read per-agent off `ctx.agents`, not hard-coded.
- The pairing is the manifest's `styles` sheet, not a DOM move. `index.html` puts the
  `model` anchor host directly after `#m-model-row`, and both it and the per-contribution
  `.ext-slot` are `display: contents` — so the two boxes are already adjacent siblings and
  a pair of floats is enough. Re-parenting `#m-model-row` into this extension's own
  element would read better and be wrong: teardown removes that element with everything
  inside it, core's row included.
- The rules are scoped `#m-model-row:not(.hidden) + …`, so if another extension vetoes the
  model row there is nothing to sit beside and the effort picker goes back to full width.

No capabilities required (`requires: []`) — this is a pure browser-half extension.

## Install

Extensions panel → install by git URL:

```
https://github.com/alex-pezarro-portswigger/aw-ext-effort-inline
```

`package-lock.json` is committed because an install refuses without one, even with no
dependencies.

## Tests

```
npm test
```

Exercises the contribution against a stub registrar and `<select>`: the anchor and
`hides`, the per-agent options, whether a pick survives a model change, and the
`fields()` write-back. The layout is CSS, so the last three tests instead assert that the
stylesheet and the markup still name the same classes and the same adjacency — a rename
on either side is otherwise silent.
