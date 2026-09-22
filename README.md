# aw-ext-effort-inline

An [Agent Wrangler](https://github.com/alex-pezarro-portswigger/agent-wrangler) extension
that moves the dispatch modal's **Effort** picker out of *Advanced options* and puts it
directly beneath the model selector.

Uses the `dispatch.field` client slot (host API `^1.6.0`):

- `hideDispatchField: ['effort']` in the manifest discloses that it may suppress the core
  effort row; the contribution's `hides: ['effort']` is the actual use.
- Hiding is presentation only, so the contribution's `fields()` writes `effort` back into
  the dispatch payload — otherwise the invisible core select's value would be sent.
- The effort vocabulary is read per-agent off `ctx.agents`, not hard-coded.

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
`fields()` write-back.
