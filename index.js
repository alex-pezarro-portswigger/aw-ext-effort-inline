import { fileURLToPath } from 'node:url';
import path from 'node:path';

// The loader resolves `client` inside this directory's public/ subdir, so the
// manifest has to say where it lives.
export const dir = path.dirname(fileURLToPath(import.meta.url));

export default {
  id: 'effort-inline',
  label: 'Effort beside model',
  help: 'Draws the effort picker in line with the model selector instead of inside Advanced options.',
  defaultEnabled: true,
  // 1.9.0 is where `dispatch.field` and `hideDispatchField` landed (this said
  // 1.6.0, which is `usage:read`/`sessions:bill` — the range was satisfiable by
  // today's server and so never bit, but it claimed to run on 1.6.x, where an
  // older server quarantines the unknown manifest key and an older slots.js
  // throws on the unknown slot name). The range is the thing that says so up
  // front, so it has to name the version that actually serves the slot.
  engines: { wranglerApi: '^1.9.0' },
  // The DISCLOSURE half of the veto: what this extension may suppress, read
  // before any of its code runs. The contribution's own `hides` is filtered
  // against it.
  hideDispatchField: ['effort'],
  client: 'public/client.js',
  // The side-by-side layout itself. A <link> the board adds before the module
  // and removes on unload, so the rules on #m-model-row — a row core owns —
  // cannot outlive the extension that wants it narrowed.
  styles: 'public/effort-inline.css',
};
