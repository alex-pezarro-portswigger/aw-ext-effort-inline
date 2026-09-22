// Browser half. One `dispatch.field` contribution at the `model` anchor, which
// sits just below #m-model-row, so the effort picker reads as part of the model
// choice rather than hiding in Advanced options.

// The effort vocabulary is per-agent and comes off ctx.agents (the board's own
// `agents` announcement); this is only the fallback for the window before that
// announcement lands, and the leading blank is "pass nothing" → agent default.
const FALLBACK_EFFORTS = [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }];

function effortsFor(ctx) {
  const agentId = ctx?.draft?.agent || 'claude';
  const agents = Array.isArray(ctx?.agents) ? ctx.agents : [];
  const agent = agents.find((a) => a.id === agentId) || agents[0];
  const efforts = Array.isArray(agent?.efforts) ? agent.efforts : null;
  return [{ value: '', label: 'Default' }, ...(efforts || FALLBACK_EFFORTS)];
}

export default {
  register(reg) {
    // One contribution, so one element, so one `select` handle is enough — the
    // modal's anchor hosts are torn down and rebuilt around it.
    let select = null;

    reg.register('dispatch.field', {
      id: 'effort',
      at: 'model',
      // Must be a subset of the manifest's hideDispatchField or the board drops
      // the name and reports it. Hiding is PRESENTATION ONLY: the core select
      // keeps its value, which is why fields() below writes `effort` back.
      hides: ['effort'],

      mount(el) {
        el.innerHTML = '<label for="ei-effort">Effort</label><select id="ei-effort"></select>';
        select = el.querySelector('#ei-effort');
      },

      // ctx: { mode: 'launch'|'schedule', draft, agents }. Called on open, on
      // model change and whenever the client extension set changes, so it has
      // to be idempotent and keep the human's current pick where it still
      // exists in the new agent's vocabulary.
      update(el, ctx) {
        if (!select) return;
        const want = effortsFor(ctx);
        const keep = select.value;
        select.replaceChildren(...want.map(({ value, label }) => {
          const o = document.createElement('option');
          o.value = value;
          o.textContent = label;
          return o;
        }));
        if (want.some((e) => e.value === keep)) select.value = keep;
      },

      // Spread over core's payload. Because `effort` is hidden this is the ONLY
      // thing writing it — returning nothing would send the invisible core
      // select's value instead. `undefined` means "no opinion" and is dropped,
      // which is exactly what the blank Default option should do.
      fields() {
        return { effort: select?.value || undefined };
      },

      unmount() { select = null; },
    });
  },
};
