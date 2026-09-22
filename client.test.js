import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import client from './public/client.js';

// Enough of a DOM for one <select>: the contribution only ever builds options
// and reads/writes `value`. No jsdom, matching Agent Wrangler's own public/ tests.
function stubSelect() {
  return {
    id: 'ei-effort',
    options: [],
    value: '',
    replaceChildren(...kids) {
      this.options = kids;
      // A real <select> drops a value that no longer has an option.
      if (!kids.some((o) => o.value === this.value)) this.value = kids[0]?.value ?? '';
    },
  };
}

function stubHost() {
  const select = stubSelect();
  return { select, innerHTML: '', querySelector: () => select };
}

const CSS = fs.readFileSync(new URL('./public/effort-inline.css', import.meta.url), 'utf8');

// The board's registrar, as slots.forExtension() hands it over.
function mountContribution() {
  let contribution = null;
  client.register({ register: (slot, c) => { assert.equal(slot, 'dispatch.field'); contribution = c; } });
  const host = stubHost();
  contribution.mount(host);
  return { contribution, host };
}

globalThis.document = { createElement: () => ({ value: '', textContent: '' }) };

const AGENTS = [
  { id: 'claude', efforts: [{ value: 'low', label: 'Low' }, { value: 'high', label: 'High' }] },
  { id: 'codex', efforts: [{ value: 'medium', label: 'Medium' }] },
];
const ctx = (agent) => ({ mode: 'launch', draft: { agent }, agents: AGENTS });

test('registers at the model anchor and hides only what the manifest discloses', () => {
  const { contribution } = mountContribution();
  assert.equal(contribution.id, 'effort');
  assert.equal(contribution.at, 'model');
  assert.deepEqual(contribution.hides, ['effort']);
});

test('options come off ctx.agents, with a leading Default', () => {
  const { contribution, host } = mountContribution();
  contribution.update(host, ctx('claude'));
  assert.deepEqual(host.select.options.map((o) => o.value), ['', 'low', 'high']);
  assert.equal(host.select.options[0].textContent, 'Default');
});

test('a pick survives a model change that keeps the level, and is dropped when it does not', () => {
  const { contribution, host } = mountContribution();
  contribution.update(host, ctx('claude'));
  host.select.value = 'high';
  contribution.update(host, ctx('claude'));
  assert.equal(host.select.value, 'high');
  contribution.update(host, ctx('codex')); // codex has no 'high'
  assert.equal(host.select.value, '');
});

test('fields() writes effort back, since hiding is presentation only', () => {
  const { contribution, host } = mountContribution();
  contribution.update(host, ctx('claude'));
  host.select.value = 'low';
  assert.deepEqual(contribution.fields(), { effort: 'low' });
  // Default means "no opinion": undefined is dropped from the merge rather than
  // blanking anything.
  host.select.value = '';
  assert.deepEqual(contribution.fields(), { effort: undefined });
});

test('falls back to a generic vocabulary before the agents announcement lands', () => {
  const { contribution, host } = mountContribution();
  contribution.update(host, { mode: 'launch', draft: {}, agents: [] });
  assert.deepEqual(host.select.options.map((o) => o.value), ['', 'low', 'medium', 'high']);
});

test('unmount releases the select and fields() stays safe', () => {
  const { contribution, host } = mountContribution();
  contribution.update(host, ctx('claude'));
  contribution.unmount(host);
  assert.deepEqual(contribution.fields(), { effort: undefined });
});

// ── The side-by-side layout ───────────────────────────────────────────────
// It is CSS, so there is nothing to execute — but the stylesheet and the
// markup are two halves of one mechanism, and a rename on either side is
// silent. These assert they still name the same things.

test('the markup is one floatable column plus a clear, not loose siblings', () => {
  const { host } = mountContribution();
  assert.match(host.innerHTML, /<div class="ei-field">.*<label[^>]*>Effort<\/label>.*<select id="ei-effort"><\/select>.*<\/div>/);
  // The clear has to come AFTER the field: it is what closes the float row so
  // the worktree box below does not ride up beside it.
  assert.ok(host.innerHTML.indexOf('ei-clear') > host.innerHTML.indexOf('ei-field'));
});

test('the stylesheet floats the model row and this field against each other', () => {
  for (const sel of ['#m-model-row:not(.hidden)', '.ei-field', '.ei-clear']) {
    assert.ok(CSS.includes(sel), `stylesheet should still target ${sel}`);
  }
  // The pairing rides on index.html putting the `model` anchor host directly
  // after the row — asserted core-side by dispatch-modal.test.js. If that
  // adjacency ever goes, this selector is what stops matching.
  assert.match(CSS, /#m-model-row:not\(\.hidden\) \+ \.ext-dispatch-slot \.ei-field/);
});

test('the field drops core\'s contribution lead-in, so the two labels line up', () => {
  // styles.css gives a contribution's first element 12px of top margin; inside
  // a float that is 12px of misalignment against the model row.
  assert.match(CSS, /\.ei-field\s*\{[^}]*margin-top:\s*0/s);
});
