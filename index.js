import { fileURLToPath } from 'node:url';
import path from 'node:path';

// The loader resolves `client` inside this directory's public/ subdir, so the
// manifest has to say where it lives.
export const dir = path.dirname(fileURLToPath(import.meta.url));

export default {
  id: 'effort-inline',
  label: 'Effort beside model',
  help: 'Draws the effort picker next to the model selector instead of inside Advanced options.',
  defaultEnabled: true,
  // 1.6.0 is where `dispatch.field` and `hideDispatchField` landed. An older
  // server quarantines the unknown manifest key and an older slots.js throws on
  // the unknown slot name, so the range is the thing that says so up front.
  engines: { wranglerApi: '^1.6.0' },
  // The DISCLOSURE half of the veto: what this extension may suppress, read
  // before any of its code runs. The contribution's own `hides` is filtered
  // against it.
  hideDispatchField: ['effort'],
  client: 'public/client.js',
};
