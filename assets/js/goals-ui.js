/* OpsLog — Goals screen, goal / goal-task dialogs, and the dashboard calendar + goals panel. */
(function (WL) {
  'use strict';
  const { U, Store, Categories, Goals } = WL;
  const $ = U.$, $$ = U.$$;
  const A = () => WL.AppUI;

  const st = { goal: 'all', owner: 'mine', status: 'open', opt: true, q: '' };
  const cal = { y: new Date().getFullYear(), m: new Date().getMonth(), sel: U.ymd(new Date()) };
  const STATE_ICON = { open: '', 'in-progress': 'clock', done: 'check', blocked: 'clock', skipped: '' };
  const fmtShort = (ymd) => { const d = U.parseYmd(ymd); return `${U.DAYS_SHORT[d.getDay()]} ${d.getDate()} ${U.MONTHS_SHORT[d.getMonth()]}`; };
  const when = (t) => (t.start && t.due && t.start !== t.due ? `${fmtShort(t.start)} – ${fmtShort(t.due)}` : fmtShort(t.due || t.start));
  const goalIndex = (id) => Goals.list().findIndex((g) => g.id === id) + 1;

  /* ---------------- dashboard: goals panel ---------------- */
  function dashGoals() {
    const gs = Goals.list();
    if (!gs.length) {
      return `<section class="card goals-panel">
        <header class="gp-head"><h3>Get started with goals</h3><button class="btn btn-primary sm" data-goal-new>New goal</button></header>
        <div class="gp-steps">
          <div class="gp-step"><span class="gp-num">1</span><div class="gp-card"><b>Import your goal plan</b><p>Load a goal plan file with goals, metrics and scheduled tasks. It stays in this browser.</p>
            <label class="link-btn">Import a plan file →<input type="file" accept="application/json,.json" data-goal-import hidden /></label></div></div>
          <div class="gp-step"><span class="gp-num">2</span><div class="gp-card"><b>Create your first goal</b><p>Name it, add the metrics you're measured on, then schedule the tasks that get you there.</p>
            <button class="link-btn" data-goal-new>Create a goal →</button></div></div>
        </div></section>`;
    }
    return `<section class="card goals-panel">
      <header class="gp-head"><div><h3>${U.esc(Goals.title() || 'Your goals')}</h3><p class="muted small">${gs.length} goal${gs.length > 1 ? 's' : ''} · ${Goals.tasks().length} scheduled tasks</p></div>
        <a class="btn btn-primary sm" href="#/goals">Open goals</a></header>
      <div class="gp-steps stack">${gs.slice(0, 3).map((g, i) => {
        const p = Goals.progress(g.id);
        const n = Goals.nextFor(g.id);
        return `<a class="gp-step" href="#/goals" data-goal-filter="${g.id}" style="--gc:${g.color}">
          <span class="gp-num">${i + 1}</span>
          <div class="gp-card"><b>${U.esc(g.name)}</b>
            <div class="gp-pct"><div class="progress"><span style="width:${p.pct}%;background:${g.color}"></span></div><span class="gp-pv">${p.pct}%</span></div>
            <p>${n ? `Next: <span class="mono">${U.esc(n.ticket)}</span> ${U.safe(n.title)} · ${fmtShort(n.start || n.due)}` : 'All tasks done.'}${p.late ? ` <span class="badge late">${p.late} overdue</span>` : ''}</p>
          </div></a>`;
      }).join('')}</div>
      ${(() => {
        const t0 = U.ymd(new Date());
        const key = (t) => (t.start > t0 ? t.start : t.due);
        const next = Goals.upcoming(7, { onlyMine: true }).filter((t) => (t.due || t.start) >= t0).sort((a, b) => key(a).localeCompare(key(b))).slice(0, 4);
        return next.length ? `<div class="gp-next"><p class="eyebrow">Your next 7 days</p>${next.map((t) => `<div class="ca-row" style="--gc:${Goals.colorOf(t.goalId)}"><span class="muted small gp-d">${t.start > t0 ? fmtShort(t.start) : 'until ' + fmtShort(t.due)}</span><span class="badge mono">${U.esc(t.ticket)}</span><span class="ca-t">${U.safe(t.title)}</span></div>`).join('')}</div>` : '';
      })()}</section>`;
  }

  /* ---------------- dashboard: calendar ---------------- */
  function dashCalendar() {
    const ws = Store.settings.weekStart || 0;
    const first = new Date(cal.y, cal.m, 1);
    const start = U.addDays(first, -((first.getDay() - ws + 7) % 7));
    const today = U.ymd(new Date());
    const tasks = Goals.tasks();
    const logged = new Set(Store.entries.filter((e) => !e.goalId && !e.templateId).map((e) => U.ymd(new Date(e.when))));
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = U.addDays(start, i);
      const k = U.ymd(d);
      const dueHere = tasks.filter((t) => (t.due || t.start) === k && t.status !== 'done');
      const hol = Goals.holidaysOn(k);
      const dots = [
        ...[...new Set(dueHere.map((t) => t.goalId))].slice(0, 2).map((g) => `<i style="background:${Goals.colorOf(g)}"></i>`),
        hol.length ? '<i class="hol"></i>' : '', logged.has(k) ? '<i class="log"></i>' : '',
      ].join('');
      cells.push(`<button class="cal-d ${d.getMonth() !== cal.m ? 'out' : ''} ${k === today ? 'today' : ''} ${k === cal.sel ? 'sel' : ''} ${hol.length ? 'is-hol' : ''}" data-cal-day="${k}"
        aria-label="${U.fmtDate(d)}${dueHere.length ? `, ${dueHere.length} goal task${dueHere.length > 1 ? 's' : ''} due` : ''}${hol.length ? ', ' + U.esc(hol[0].name) : ''}"><span>${d.getDate()}</span><em>${dots}</em></button>`);
    }
    const heads = [0, 1, 2, 3, 4, 5, 6].map((i) => `<span>${U.DAYS_SHORT[(i + ws) % 7]}</span>`).join('');
    // agenda for the selected day
    const sel = cal.sel;
    const active = tasks.filter((t) => t.status !== 'done' && Goals.isActiveOn(t, sel)).slice(0, 4);
    const hol = Goals.holidaysOn(sel);
    const nLog = Store.entries.filter((e) => !e.goalId && !e.templateId && U.ymd(new Date(e.when)) === sel).length;
    return `<section class="card cal-card">
      <header class="cal-head"><button class="icon-btn sm ghostless" data-cal-shift="-1" aria-label="Previous month">${U.icon('chevL')}</button>
        <b>${U.MONTHS[cal.m]} ${cal.y}</b><button class="icon-btn sm ghostless" data-cal-shift="1" aria-label="Next month">${U.icon('chevR')}</button></header>
      <div class="cal-grid"><div class="cal-dow">${heads}</div><div class="cal-days">${cells.join('')}</div></div>
      <div class="cal-agenda">
        <div class="ca-title"><b>${U.relDay(U.parseYmd(sel))}</b><span class="muted small">${nLog ? `${nLog} logged` : ''}</span></div>
        ${hol.map((h) => `<div class="ca-row hol">${U.esc(h.name)}</div>`).join('')}
        ${active.map((t) => `<div class="ca-row" style="--gc:${Goals.colorOf(t.goalId)}"><span class="badge mono">${U.esc(t.ticket)}</span><span class="ca-t">${U.safe(t.title)}</span></div>`).join('')}
        ${!active.length && !hol.length ? '<div class="ca-row muted">No goal tasks on this day.</div>' : ''}
        ${Goals.list().length ? `<button class="link-btn" data-goal-task-on="${sel}">+ Schedule a task on this day</button>` : ''}
      </div></section>`;
  }

  /* ---------------- Goals screen ---------------- */
  function view() {
    const gs = Goals.list();
    U.$('#pageSub').textContent = gs.length ? `${gs.length} goals · ${Goals.tasks().length} scheduled tasks` : 'Set goals and schedule the tasks that achieve them';
    const actions = `<div class="btn-row goal-actions">
        <button class="btn btn-primary" data-goal-task-new>${U.icon('plus')} Schedule a task</button>
        <button class="btn btn-ghost" data-goal-new>${U.icon('flag')} New goal</button>
        <label class="btn btn-ghost">${U.icon('upload')} Import plan<input type="file" accept="application/json,.json" data-goal-import hidden /></label>
        ${gs.length ? `<button class="btn btn-ghost" id="goalExport">${U.icon('download')} Export</button>` : ''}
      </div>`;
    if (!gs.length) return actions + dashGoals();

    const cards = gs.map((g, i) => {
      const p = Goals.progress(g.id);
      return `<article class="card goal-card" style="--gc:${g.color}">
        <div class="gc-head"><div><p class="eyebrow">Goal ${i + 1}</p><h3>${U.esc(g.name)}</h3></div><b class="gc-pct">${p.pct}%</b></div>
        <div class="progress"><span style="width:${p.pct}%;background:${g.color}"></span></div>
        <ul class="gc-metrics">${(g.metrics || []).map((m) => { const mp = Goals.metricProgress(g.id, m.id); return `<li><span class="mono gc-mid">${U.esc(m.id)}</span><span>${U.esc(m.name)}</span><span class="mono muted">${mp.done}/${mp.total}</span></li>`; }).join('') || '<li class="muted">No metrics yet.</li>'}</ul>
        <div class="gc-foot">${p.late ? `<span class="badge late">${p.late} overdue</span>` : `<span class="muted small">${p.done} of ${p.total} done</span>`}
          <span class="spacer"></span><button class="btn btn-ghost sm" data-goal-task-new="${g.id}">${U.icon('plus')} Task</button><button class="icon-btn sm" data-goal-edit="${g.id}" aria-label="Edit ${U.esc(g.name)}">${U.icon('edit')}</button></div>
      </article>`;
    }).join('');

    const week = Goals.upcoming(7, { onlyMine: st.owner === 'mine' });
    const t0 = U.ymd(new Date());
    const soon = Goals.upcoming(21, { onlyMine: st.owner === 'mine' }).filter((t) => (t.start || t.due) > U.ymd(U.addDays(new Date(), 7))).slice(0, 8);

    return `${actions}
      <div class="goal-grid">${cards}</div>
      <div class="grid-2">
        ${A().card(`This week <span class="muted small">${week.length} open${st.owner === 'mine' ? ' · yours' : ''}</span>`, week.length ? `<div class="gt-list compact">${week.slice(0, 8).map(row).join('')}</div>${week.length > 8 ? `<p class="muted small more-note">+ ${week.length - 8} more in the schedule below</p>` : ''}` : A().empty('Nothing scheduled this week.'))}
        ${A().card('Coming up · next 3 weeks', soon.length ? `<ol class="soon">${soon.map((t) => `<li><span class="mono muted">${fmtShort(t.start || t.due)}</span><span><span class="badge mono" style="color:${Goals.colorOf(t.goalId)}">${U.esc(t.ticket)}</span> ${U.safe(t.title)}${t.owner && !Goals.mine(t) ? ` <span class="muted small">· ${U.esc(t.owner)}</span>` : ''}</span></li>`).join('')}</ol>` : A().empty('Nothing else in the next three weeks.'))}
      </div>
      <section class="ledger">
        <div class="ledger-head"><h3>Task schedule</h3>
          <div class="toolbar">
            <div class="seg" role="tablist"><button class="${st.goal === 'all' ? 'on' : ''}" data-gl-goal="all">All goals</button>${gs.map((g) => `<button class="${st.goal === g.id ? 'on' : ''}" data-gl-goal="${g.id}">${U.esc(g.short || g.id)}</button>`).join('')}</div>
            <select id="glOwner" aria-label="Owner"><option value="mine" ${st.owner === 'mine' ? 'selected' : ''}>My tasks</option><option value="all" ${st.owner === 'all' ? 'selected' : ''}>Anyone</option>${Goals.owners().map((o) => `<option ${st.owner === o ? 'selected' : ''}>${U.esc(o)}</option>`).join('')}</select>
            <select id="glStatus" aria-label="Status">${[['open', 'Open'], ['all', 'All'], ['done', 'Done'], ['late', 'Overdue']].map(([v, l]) => `<option value="${v}" ${st.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
            <label class="field check inline"><input type="checkbox" id="glOpt" ${st.opt ? 'checked' : ''}/><span>Stretch tasks</span></label>
            <label class="search sm">${U.icon('search')}<input id="glQ" placeholder="Search tasks" value="${U.esc(st.q)}" /></label>
          </div></div>
        <div id="glList">${ledger()}</div>
      </section>`;
  }

  function filtered() {
    const q = st.q.toLowerCase();
    return Goals.tasks().filter((t) =>
      (st.goal === 'all' || t.goalId === st.goal) &&
      (st.owner === 'all' || (st.owner === 'mine' ? Goals.mine(t) : t.owner === st.owner)) &&
      (st.status === 'all' || (st.status === 'done' ? t.status === 'done' : st.status === 'late' ? Goals.isLate(t) : t.status !== 'done')) &&
      (st.opt || !t.optional) &&
      (!q || `${t.ticket} ${t.title} ${t.details} ${t.owner}`.toLowerCase().includes(q)))
      .sort((a, b) => (a.start || a.due).localeCompare(b.start || b.due));
  }

  function ledger() {
    const list = filtered();
    if (!list.length) return A().empty('No tasks match these filters.');
    const months = new Map();
    list.forEach((t) => { const k = (t.start || t.due).slice(0, 7); if (!months.has(k)) months.set(k, []); months.get(k).push(t); });
    const hols = Goals.data().holidays || [];
    return [...months.entries()].map(([k, ts]) => {
      const [y, m] = k.split('-').map(Number);
      const mh = hols.filter((h) => h.start.slice(0, 7) === k);
      return `<div class="gl-month"><div class="gl-mh"><h4>${U.MONTHS[m - 1]} ${y}</h4><span class="muted small">${ts.length} task${ts.length > 1 ? 's' : ''}</span>
        ${mh.map((h) => `<span class="badge hol" title="${U.esc(h.name)}">${fmtShort(h.start)} · ${U.esc(h.name)}</span>`).join('')}</div>
        <div class="card gt-list">${ts.map(row).join('')}</div></div>`;
    }).join('');
  }

  function row(t) {
    const g = Goals.get(t.goalId);
    const late = Goals.isLate(t);
    const ic = STATE_ICON[t.status];
    return `<div class="gt-row gs-${t.status} ${late ? 'late' : ''}" style="--gc:${g ? g.color : 'var(--muted)'}">
      <button class="gt-stat" data-gt-cycle="${t.id}" aria-label="${t.ticket}: ${A().STATUS[t.status] || t.status} — change status" title="Open → In progress → Done">${ic ? U.icon(ic) : ''}</button>
      <div class="gt-when mono">${when(t)}${t.start && t.due && t.start !== t.due ? `<small>${Math.round((U.parseYmd(t.due) - U.parseYmd(t.start)) / 864e5) + 1} days</small>` : ''}</div>
      <div class="gt-body"><div class="gt-title">${U.safe(t.title)}</div>
        ${t.details ? `<div class="gt-det">${U.safe(t.details)}</div>` : ''}
        <div class="gt-tags"><span class="badge mono gt-id">${U.esc(t.ticket)}</span>${t.metric ? `<span class="badge mono gt-m">${U.esc(t.metric)}</span>` : ''}${t.phase ? `<span class="badge">${U.esc(t.phase)}</span>` : ''}
          ${t.owner ? `<span class="badge ${Goals.mine(t) ? 'own-me' : ''}">${U.esc(t.owner)}</span>` : ''}${t.ramadan || Goals.inRamadan(t.start || t.due) ? '<span class="badge ram">Ramadan hours</span>' : ''}
          ${t.optional ? '<span class="badge">Stretch</span>' : ''}${late ? '<span class="badge late">Overdue</span>' : ''}${A().prBadge(t.priority)}</div></div>
      <button class="icon-btn sm" data-gt-edit="${t.id}" aria-label="Edit ${U.esc(t.ticket)}">${U.icon('edit')}</button>
    </div>`;
  }

  function after() {
    const v = $('#view');
    const root = $('.ledger', v);
    if (root) {
      $$('[data-gl-goal]', root).forEach((b) => b.addEventListener('click', () => { st.goal = b.dataset.glGoal; WL.App.render(); }));
      $('#glOwner').addEventListener('change', (e) => { st.owner = e.target.value; WL.App.render(); });
      $('#glStatus').addEventListener('change', (e) => { st.status = e.target.value; $('#glList').innerHTML = ledger(); });
      $('#glOpt').addEventListener('change', (e) => { st.opt = e.target.checked; $('#glList').innerHTML = ledger(); });
      $('#glQ').addEventListener('input', U.debounce((e) => { st.q = e.target.value; $('#glList').innerHTML = ledger(); }, 150));
    }
    const ex = $('#goalExport');
    if (ex) ex.addEventListener('click', () => U.download(`opslog-goals-${U.ymd(new Date())}.json`, Goals.exportPlan(), 'application/json'));
  }

  /* ---------------- global clicks (dashboard + goals page) ---------------- */
  function onClick(e) {
    const c = e.target.closest('[data-gt-cycle]');
    if (c) { Goals.cycle(c.dataset.gtCycle); return; }
    const ed = e.target.closest('[data-gt-edit]');
    if (ed) { openTask(ed.dataset.gtEdit); return; }
    const nt = e.target.closest('[data-goal-task-new]');
    if (nt) { openTask(null, { goalId: nt.dataset.goalTaskNew || undefined }); return; }
    const on = e.target.closest('[data-goal-task-on]');
    if (on) { openTask(null, { start: on.dataset.goalTaskOn }); return; }
    const ng = e.target.closest('[data-goal-new]');
    if (ng) { openGoal(null); return; }
    const eg = e.target.closest('[data-goal-edit]');
    if (eg) { openGoal(eg.dataset.goalEdit); return; }
    const gf = e.target.closest('[data-goal-filter]');
    if (gf) { st.goal = gf.dataset.goalFilter; return; }
    const cs = e.target.closest('[data-cal-shift]');
    if (cs) { const d = new Date(cal.y, cal.m + Number(cs.dataset.calShift), 1); cal.y = d.getFullYear(); cal.m = d.getMonth(); WL.App.render(); return; }
    const cd = e.target.closest('[data-cal-day]');
    if (cd) {
      cal.sel = cd.dataset.calDay;
      const d = U.parseYmd(cal.sel);
      if (d.getMonth() !== cal.m) { cal.y = d.getFullYear(); cal.m = d.getMonth(); }
      WL.App.render();
    }
  }
  function onChange(e) {
    const f = e.target.closest('[data-goal-import]');
    if (!f || !f.files[0]) return;
    f.files[0].text().then((txt) => {
      const r = Goals.importPlan(txt);
      U.toast(`Imported ${r.goals} goal${r.goals === 1 ? '' : 's'}: ${r.created} new tasks${r.updated ? `, ${r.updated} updated` : ''}`, 'success', 5000);
      WL.App.render();
    }).catch((err) => U.toast('Import failed: ' + err.message, 'error', 6000));
    f.value = '';
  }

  /* ---------------- dialogs ---------------- */
  let editingTask = null;
  function openTask(id, preset = {}) {
    const gs = Goals.list();
    if (!gs.length) { openGoal(null); U.toast('Create a goal first, then schedule its tasks.', 'info'); return; }
    editingTask = id ? Store.get(id) : null;
    const t = editingTask || { goalId: preset.goalId || (st.goal !== 'all' ? st.goal : gs[0].id), metric: '', title: '', details: '', owner: Store.settings.name ? Store.settings.name.split(' ')[0] : '', start: preset.start || U.ymd(new Date()), due: preset.start || U.ymd(new Date()), priority: 'normal', phase: '', optional: false };
    $('#gtTitleH').textContent = editingTask ? `Edit ${editingTask.ticket}` : 'Schedule a goal task';
    $('#gtGoal').innerHTML = gs.map((g) => `<option value="${g.id}">${U.esc(g.short || g.name)}</option>`).join('');
    $('#gtGoal').value = t.goalId;
    const fillMetrics = () => { const g = Goals.get($('#gtGoal').value); $('#gtMetric').innerHTML = '<option value="">—</option>' + (g.metrics || []).map((m) => `<option value="${U.esc(m.id)}">${U.esc(m.id)} · ${U.esc(m.name)}</option>`).join(''); };
    fillMetrics();
    $('#gtGoal').onchange = fillMetrics;
    $('#gtMetric').value = t.metric || '';
    $('#gtText').value = t.title;
    $('#gtDetails').value = t.details || '';
    $('#gtOwner').value = t.owner || '';
    $('#gtOwners').innerHTML = Goals.owners().map((o) => `<option value="${U.esc(o)}">`).join('');
    $('#gtStart').value = t.start || t.due;
    $('#gtDue').value = t.due || t.start;
    $('#gtPriority').value = t.priority || 'normal';
    $('#gtPhase').innerHTML = ['', ...Goals.PHASES].map((p) => `<option value="${p}">${p || '—'}</option>`).join('');
    $('#gtPhase').value = t.phase || '';
    $('#gtOptional').checked = !!t.optional;
    $('#gtRepeatWrap').hidden = !!editingTask;
    $('#gtRepeat').value = 'none';
    $('#gtCount').value = 4;
    $('#gtDelete').hidden = !editingTask;
    $('#gtDlg').showModal();
    setTimeout(() => $('#gtText').focus(), 30);
  }

  let editingGoal = null;
  function openGoal(id) {
    editingGoal = id ? Goals.get(id) : null;
    const g = editingGoal || { name: '', short: '', color: Goals.COLORS[Goals.list().length % Goals.COLORS.length], category: 'other', start: '', end: '', metrics: [] };
    $('#goalTitleH').textContent = editingGoal ? `Edit ${editingGoal.id}` : 'New goal';
    $('#gName').value = g.name;
    $('#gShort').value = g.short || '';
    $('#gStart').value = g.start || '';
    $('#gEnd').value = g.end || '';
    $('#gCategory').innerHTML = Categories.list.map((c) => `<option value="${c.id}">${U.esc(c.name)}</option>`).join('');
    $('#gCategory').value = g.category || 'other';
    $('#gColors').innerHTML = Goals.COLORS.map((c) => `<label class="swatch" style="--sw:${c}"><input type="radio" name="gColor" value="${c}" ${c === g.color ? 'checked' : ''} aria-label="Colour ${c}"/><span></span></label>`).join('');
    $('#gMetrics').value = (g.metrics || []).map((m) => `${m.id} ${m.name}`).join('\n');
    $('#gDelete').hidden = !editingGoal;
    $('#gDelete').textContent = 'Delete goal';
    delete $('#gDelete').dataset.armed;
    $('#goalDlg').showModal();
    setTimeout(() => $('#gName').focus(), 30);
  }

  function wireDialogs() {
    $('#gtForm').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const data = {
        goalId: $('#gtGoal').value, metric: $('#gtMetric').value, title: $('#gtText').value.trim(), details: $('#gtDetails').value.trim(),
        owner: $('#gtOwner').value.trim(), start: $('#gtStart').value, due: $('#gtDue').value || $('#gtStart').value,
        priority: $('#gtPriority').value, phase: $('#gtPhase').value, optional: $('#gtOptional').checked,
      };
      if (!data.title || !data.start) return;
      if (data.due < data.start) { U.toast('The due date is before the start date', 'warn'); return; }
      if (editingTask) {
        const g = Goals.get(data.goalId);
        Store.update(editingTask.id, { ...data, when: U.parseYmd(data.start).toISOString(), tags: [g.short || g.id] });
        U.toast('Task updated', 'success');
      } else {
        const out = Goals.addTask(data, { repeat: $('#gtRepeat').value, count: Number($('#gtCount').value) || 1 });
        U.toast(out.length > 1 ? `Scheduled ${out.length} tasks (${out[0].ticket} … ${out[out.length - 1].ticket})` : `Scheduled ${out[0].ticket} for ${U.relDay(U.parseYmd(data.start))}`, 'success');
      }
      $('#gtDlg').close();
    });
    $('#gtDelete').addEventListener('click', () => { if (editingTask) { Store.remove(editingTask.id); $('#gtDlg').close(); U.toast('Task deleted', 'success'); } });

    $('#goalForm').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = $('#gName').value.trim();
      if (!name) return;
      const metrics = $('#gMetrics').value.split('\n').map((l) => l.trim()).filter(Boolean).map((l, i) => {
        const m = l.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
        return m ? { id: m[1], name: m[2] } : { id: `${(editingGoal ? editingGoal.id : 'G' + (Goals.list().length + 1)).replace('G', '')}.${i + 1}`, name: l };
      });
      const g = Object.assign({}, editingGoal || {}, {
        name, short: $('#gShort').value.trim() || name.split(/\s+/).slice(0, 2).join(' '), category: $('#gCategory').value,
        start: $('#gStart').value, end: $('#gEnd').value, metrics, color: ($$('input[name="gColor"]').find((r) => r.checked) || {}).value || Goals.COLORS[0],
      });
      Goals.saveGoal(g);
      $('#goalDlg').close();
      U.toast(editingGoal ? 'Goal updated' : 'Goal created — now schedule its tasks', 'success');
      if (!editingGoal) location.hash = '#/goals';
    });
    $('#gDelete').addEventListener('click', (e) => {
      const b = e.currentTarget;
      if (!editingGoal) return;
      if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = `Confirm: delete goal and its ${Goals.tasks(editingGoal.id).length} tasks`; return; }
      Goals.removeGoal(editingGoal.id);
      $('#goalDlg').close();
      U.toast('Goal deleted', 'success');
    });
  }

  function init() {
    wireDialogs();
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
  }
  document.addEventListener('DOMContentLoaded', init);

  WL.GoalsUI = { view, after, dashGoals, dashCalendar, openTask, openGoal };
})(window.WL);
