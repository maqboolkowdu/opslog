/* OpsLog — Focus dial: timed focus sessions (work, study, break, socialize).
   While a session runs, Ava holds check-in calls and posts quiet chat messages instead. */
(function (WL) {
  'use strict';
  const { U, Store, Voice } = WL;
  const $ = U.$;

  const MODES = [
    { id: 'work', name: 'Work', hint: 'Deep work', color: '#5b4ce6' },
    { id: 'study', name: 'Study', hint: 'Learn & read', color: '#0e7490' },
    { id: 'break', name: 'Break', hint: 'Step away', color: '#0b996e' },
    { id: 'social', name: 'Socialize', hint: 'Talk to people', color: '#b7791f' },
  ];
  const DURATIONS = [15, 30, 60, 90];
  const K_ACTIVE = 'opslog:focus:active';
  const K_LOG = 'opslog:focus:log:v1';

  const read = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } };
  const write = (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };

  let active = read(K_ACTIVE, null); // { mode, minutes, startAt, endAt, pausedLeft, held }
  const modeOf = (id) => MODES.find((m) => m.id === id) || MODES[0];

  const isActive = () => !!active;
  const leftMs = () => (!active ? 0 : active.pausedLeft != null ? active.pausedLeft : Math.max(0, active.endAt - Date.now()));
  const fmtLeft = (ms) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${U.pad(s % 60)}`; };

  /* ---------------- sessions ---------------- */
  function start(modeId, minutes) {
    const now = Date.now();
    active = { mode: modeId, minutes, startAt: now, endAt: now + minutes * 60000, pausedLeft: null, held: 0 };
    write(K_ACTIVE, active);
    const m = modeOf(modeId);
    post({
      text: m.id === 'break' || m.id === 'social'
        ? `Enjoy your ${minutes}-minute ${m.name.toLowerCase()}. I'll hold calls until ${U.fmtTime(new Date(active.endAt))}.`
        : `${m.name} for ${minutes} minutes. Calls are on hold until ${U.fmtTime(new Date(active.endAt))}. I'll message you quietly if anything is due.`,
      ttl: 6000,
    });
    render();
  }

  function pause() {
    if (!active) return;
    if (active.pausedLeft != null) { active.endAt = Date.now() + active.pausedLeft; active.pausedLeft = null; }
    else active.pausedLeft = leftMs();
    write(K_ACTIVE, active);
    render();
  }

  function extend(min = 5) {
    if (!active) return;
    if (active.pausedLeft != null) active.pausedLeft += min * 60000; else active.endAt += min * 60000;
    active.minutes += min;
    write(K_ACTIVE, active);
    render();
  }

  function stop(completed) {
    if (!active) return;
    const s = active;
    const spent = Math.max(1, Math.round((s.minutes * 60000 - leftMs()) / 60000));
    const log = read(K_LOG, []);
    log.push({ mode: s.mode, planned: s.minutes, minutes: completed ? s.minutes : spent, start: new Date(s.startAt).toISOString(), end: new Date().toISOString(), completed: !!completed });
    write(K_LOG, log.slice(-1000));
    active = null;
    write(K_ACTIVE, null);
    const m = modeOf(s.mode);
    const mins = completed ? s.minutes : spent;
    const heldTxt = s.held ? ` I held ${s.held} check-in${s.held > 1 ? 's' : ''} for you.` : '';
    if (completed) Voice.chime('up');
    if (m.id === 'break' || m.id === 'social') {
      post({ text: `${m.name} is over.${heldTxt} Ready to get back to it?`, actions: [
        { label: 'Work 30 min', run: () => start('work', 30) },
        ...(s.held ? [{ label: 'Reply to Ava', run: () => WL.Agent.startChat() }] : []),
      ] });
    } else {
      post({ text: `${completed ? 'Nice work' : 'Session ended'}: ${mins} min of ${m.name.toLowerCase()}.${heldTxt}`, actions: [
        { label: 'Log it', run: () => { Store.add({ title: `Focus session — ${m.name} (${mins} min)`, details: `Focus dial: ${mins} of ${s.minutes} planned minutes`, category: 'other', type: 'entry', status: 'done', minutes: mins, source: 'focus', when: new Date(s.startAt).toISOString() }); U.toast('Logged to your work log', 'success'); } },
        { label: 'Break 15 min', run: () => start('break', 15) },
        ...(s.held ? [{ label: 'Reply to Ava', run: () => WL.Agent.startChat() }] : []),
      ] });
    }
    render();
  }

  function todayMinutes() {
    const today = U.ymd(new Date());
    return read(K_LOG, []).filter((x) => x.start.slice(0, 10) === today && (x.mode === 'work' || x.mode === 'study')).reduce((n, x) => n + x.minutes, 0)
      + (active && (active.mode === 'work' || active.mode === 'study') ? Math.round((active.minutes * 60000 - leftMs()) / 60000) : 0);
  }

  /* ---------------- quiet reminders (instead of calls) ---------------- */
  function dueSummary() {
    const items = [];
    const today = U.ymd(new Date());
    if (WL.Library) {
      const left = WL.Library.todays().filter((e) => e.status !== 'done').length;
      if (left) items.push(`${left} routine check${left > 1 ? 's' : ''} still open`);
    }
    if (WL.Goals) {
      WL.Goals.upcoming(0, { onlyMine: true }).slice(0, 3).forEach((t) => items.push(`${t.ticket} ${t.title}${t.due < today ? ' (overdue)' : t.due === today ? ' (due today)' : ''}`));
    }
    Store.openTasks().filter((e) => !e.templateId && !e.goalId && e.due && e.due <= today).slice(0, 2)
      .forEach((e) => items.push(`${e.title}${e.due < today ? ' (overdue)' : ' (due today)'}`));
    return items;
  }

  /** Called by the agent instead of ringing while a focus session runs. */
  function remind({ slotMin = null, mode = 'scheduled' } = {}) {
    if (active) { active.held = (active.held || 0) + 1; write(K_ACTIVE, active); }
    const when = slotMin != null ? U.fmt12(U.fromMin(slotMin)) : U.fmtTime(new Date());
    const items = dueSummary();
    post({
      text: `${mode === 'wrapup' ? 'End-of-day wrap-up' : `${when} check-in`}. I held the call so you can keep focusing.${items.length ? ' On your list:' : ' Nothing urgent is due.'}`,
      items,
      actions: [{ label: 'Reply', run: () => WL.Agent.startChat() }, { label: 'Later', run: () => {} }],
    });
  }

  /* ---------------- Ava's quiet chat messages ---------------- */
  function post({ text, items = [], actions = [], ttl = 0 }) {
    const host = $('#avaMsgs');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'ava-msg';
    el.setAttribute('role', 'status');
    el.innerHTML = `
      <div class="am-head"><span class="am-av">${U.esc((Store.settings.agentName || 'Ava')[0])}</span><b>${U.esc(Store.settings.agentName || 'Ava')}</b><span class="muted small">${U.fmtTime(new Date())} · quiet message</span>
        <button class="am-x" aria-label="Dismiss">${U.icon('x')}</button></div>
      <p>${U.safe(text)}</p>
      ${items.length ? `<ul>${items.map((i) => `<li>${U.safe(i)}</li>`).join('')}</ul>` : ''}
      ${actions.length ? `<div class="am-acts">${actions.map((a, i) => `<button class="${i === 0 ? 'btn btn-primary sm' : 'btn btn-ghost sm'}" data-i="${i}">${U.esc(a.label)}</button>`).join('')}</div>` : ''}`;
    const close = () => { el.classList.add('out'); setTimeout(() => { el.remove(); badge(); }, 200); };
    el.querySelector('.am-x').addEventListener('click', close);
    el.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => { close(); actions[Number(b.dataset.i)].run(); }));
    host.appendChild(el);
    while (host.children.length > 3) host.firstElementChild.remove();
    if (ttl) setTimeout(close, ttl);
    badge();
  }
  function badge() {
    const b = $('#focusDial .fd-badge');
    if (!b) return;
    const n = $('#avaMsgs') ? $('#avaMsgs').children.length : 0;
    b.textContent = n; b.hidden = !n;
  }

  /* ---------------- UI ---------------- */
  const R = 108, C = 2 * Math.PI * R;
  function bigDial() {
    const m = modeOf(active.mode);
    const left = leftMs();
    const p = 1 - left / (active.minutes * 60000);
    return `
      <div class="fo-dial" style="--fm:${m.color}">
        <svg viewBox="0 0 240 240" aria-hidden="true">
          <circle cx="120" cy="120" r="${R}" fill="none" stroke="var(--track)" stroke-width="12"/>
          <circle class="fo-arc" cx="120" cy="120" r="${R}" fill="none" stroke="${m.color}" stroke-width="12" stroke-linecap="round"
            stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p)}" transform="rotate(-90 120 120)"/>
        </svg>
        <div class="fo-center"><span class="fo-mode">${U.esc(m.name)}</span><b class="fo-time mono" id="foTime">${fmtLeft(left)}</b>
          <span class="muted small">${active.pausedLeft != null ? 'Paused' : `Ends ${U.fmtTime(new Date(active.endAt))}`}</span></div>
      </div>`;
  }

  function render() {
    renderCorner();
    const ov = $('#focusOverlay');
    if (!ov || ov.hidden) return;
    const tile = $('#foTile');
    if (!active) {
      tile.innerHTML = `
        <header class="fo-head"><div><h2 id="foTitle">Focus dial</h2><p class="muted">Pick what you're doing and for how long. Ava holds her calls and messages you quietly instead.</p></div>
          <button class="icon-btn sm" data-fo="close" aria-label="Close">${U.icon('x')}</button></header>
        <div class="fo-grid" role="group" aria-label="Choose a focus session">
          ${MODES.map((m) => DURATIONS.map((d) => `
            <button class="fo-cell" style="--fm:${m.color}" data-fo-start="${m.id}:${d}" aria-label="${m.name} for ${d} minutes">
              <b>${d}</b><span>min</span><em>${U.esc(m.name)}</em>
            </button>`).join('')).join('')}
        </div>
        <p class="muted small fo-foot">Focused ${U.fmtDuration(todayMinutes())} today (work and study).</p>`;
    } else {
      const next = WL.Goals ? WL.Goals.upcoming(0, { onlyMine: true })[0] : null;
      tile.innerHTML = `
        <header class="fo-head"><div><h2 id="foTitle">Stay with it</h2><p class="muted">Calls are on hold. Ava will message you quietly.</p></div>
          <button class="icon-btn sm" data-fo="close" aria-label="Minimize">${U.icon('x')}</button></header>
        ${bigDial()}
        <div class="fo-ctrls">
          <button class="btn btn-ghost" data-fo="pause">${active.pausedLeft != null ? 'Resume' : 'Pause'}</button>
          <button class="btn btn-ghost" data-fo="extend">+5 min</button>
          <button class="btn btn-primary" data-fo="stop">End session</button>
        </div>
        ${next ? `<p class="fo-next"><span class="muted small">Next up</span> <span class="badge mono">${U.esc(next.ticket)}</span> ${U.safe(next.title)}</p>` : ''}`;
    }
  }

  function renderCorner() {
    const d = $('#focusDial');
    if (!d) return;
    const ring = $('#fdArc');
    const txt = $('#fdTxt');
    d.classList.toggle('running', !!active);
    if (!active) {
      ring.style.strokeDashoffset = 125.66;
      txt.innerHTML = U.icon('clock');
      d.title = 'Focus dial';
      d.style.removeProperty('--fm');
      return;
    }
    const m = modeOf(active.mode);
    const p = 1 - leftMs() / (active.minutes * 60000);
    d.style.setProperty('--fm', m.color);
    ring.style.strokeDashoffset = 125.66 * (1 - p);
    txt.textContent = `${Math.ceil(leftMs() / 60000)}m`;
    d.title = `${m.name}: ${fmtLeft(leftMs())} left`;
  }

  function open() {
    const ov = $('#focusOverlay');
    ov.hidden = false;
    document.body.classList.add('focus-open');
    requestAnimationFrame(() => ov.classList.add('in'));
    render();
    setTimeout(() => { const f = ov.querySelector('.fo-cell, [data-fo="pause"]'); f && f.focus(); }, 60);
  }
  function close() {
    const ov = $('#focusOverlay');
    ov.classList.remove('in');
    document.body.classList.remove('focus-open');
    setTimeout(() => { ov.hidden = true; }, 180);
    $('#focusDial').focus({ preventScroll: true });
  }

  function init() {
    $('#focusDial').addEventListener('click', () => ($('#focusOverlay').hidden ? open() : close()));
    $('#focusOverlay').addEventListener('click', (e) => {
      if (e.target.classList.contains('fo-backdrop')) return close();
      const s = e.target.closest('[data-fo-start]');
      if (s) { const [m, d] = s.dataset.foStart.split(':'); start(m, Number(d)); return; }
      const a = e.target.closest('[data-fo]');
      if (!a) return;
      const act = a.dataset.fo;
      if (act === 'close') close();
      if (act === 'pause') pause();
      if (act === 'extend') extend(5);
      if (act === 'stop') { stop(false); close(); }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#focusOverlay').hidden) close(); });
    setInterval(() => {
      if (active && active.pausedLeft == null && leftMs() <= 0) { stop(true); return; }
      renderCorner();
      const t = $('#foTime');
      if (t && active) {
        t.textContent = fmtLeft(leftMs());
        const arc = $('.fo-arc');
        if (arc) arc.style.strokeDashoffset = C * (leftMs() / (active.minutes * 60000));
      }
    }, 1000);
    // A session that ended while the page was closed is wrapped up on load.
    if (active && active.pausedLeft == null && leftMs() <= 0) setTimeout(() => stop(true), 800);
    renderCorner();
  }

  WL.Focus = { MODES, DURATIONS, isActive, start, stop, pause, extend, open, close, remind, post, todayMinutes, active: () => active, leftMs };
  document.addEventListener('DOMContentLoaded', init);
})(window.WL);
