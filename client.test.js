import { test } from 'node:test';
import assert from 'node:assert/strict';
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
