/* OpsLog — Goals: goals with metrics, and the scheduled tasks that achieve them.
   Goal tasks are ordinary OpsLog entries (type "task") carrying goalId / metric / start / due,
   so they show up on the board, in reports when done, and in Ava's reminders. */
(function (WL) {
  'use strict';
  const { U, Store, Categories } = WL;

  const K = 'opslog:goals:v1';
  const COLORS = ['#4453c7', '#c0392b', '#b7791f', '#0b996e', '#7c3aed', '#0e7490'];
  const PHASES = ['Prepare', 'Execute', 'Evidence'];
  const STATE_TO_STATUS = { todo: 'open', doing: 'in-progress', done: 'done' };
  const STATUS_TO_STATE = { open: 'todo', 'in-progress': 'doing', blocked: 'doing', done: 'done', skipped: 'todo' };

  const read = () => { try { return JSON.parse(localStorage.getItem(K)) || null; } catch { return null; } };
  let data = Object.assign({ title: '', goals: [], holidays: [], ramadan: null }, read() || {});
  const save = () => {
    try { localStorage.setItem(K, JSON.stringify(data)); } catch { U.toast('Could not save goals — browser storage is full or blocked', 'error'); }
    Store.persist();
  };

  /* ---------------- goals ---------------- */
  const list = () => data.goals;
  const get = (id) => data.goals.find((g) => g.id === id) || null;
  function nextGoalId() { let n = data.goals.length + 1; while (get('G' + n)) n++; return 'G' + n; }

  function saveGoal(g) {
    const i = data.goals.findIndex((x) => x.id === g.id);
    if (i >= 0) data.goals[i] = g;
    else data.goals.push(Object.assign({ id: nextGoalId(), color: COLORS[data.goals.length % COLORS.length], metrics: [] }, g, { id: g.id || nextGoalId() }));
    save();
  }
  function removeGoal(id) {
    data.goals = data.goals.filter((g) => g.id !== id);
    Store.entries = Store.entries.filter((e) => e.goalId !== id);
    save();
  }

  /* ---------------- tasks ---------------- */
  const tasks = (goalId) => Store.entries.filter((e) => e.goalId && (!goalId || e.goalId === goalId));
  const today = () => U.ymd(new Date());
  const isLate = (t) => t.status !== 'done' && t.due && t.due < today();
  const isActiveOn = (t, ymd) => (t.start || t.due) <= ymd && (t.due || t.start) >= ymd;
  const mine = (t) => {
    const me = (Store.settings.name || '').split(' ')[0].toLowerCase();
    const o = (t.owner || '').toLowerCase();
    return !o || !me || o.includes(me);
  };

  function nextTaskId(goal, metric) {
    const prefix = (metric || goal.id).replace(/[^A-Z0-9.]/gi, '') + '-';
    let n = 1;
    while (Store.entries.some((e) => e.ticket === prefix + U.pad(n))) n++;
    return prefix + U.pad(n);
  }

  /** Build the entry for one scheduled goal task. */
  function makeTask(t) {
    const goal = get(t.goalId);
    const start = t.start || t.due || today();
    const due = t.due || start;
    return {
      title: t.title, details: t.details || '', category: t.category || goal.category || 'other',
      type: 'task', status: t.status || 'open', priority: t.priority || 'normal',
      ticket: t.ticket || nextTaskId(goal, t.metric), owner: t.owner || '', location: t.location || '',
      tags: [goal.short || goal.id], when: U.parseYmd(start).toISOString(), start, due,
      goalId: goal.id, metric: t.metric || '', phase: t.phase || '', optional: !!t.optional, ramadan: !!t.ramadan,
      source: 'goal',
    };
  }

  /** Add a task, optionally repeated (weekly / fortnightly / monthly) `count` times. */
  function addTask(t, { repeat = 'none', count = 1 } = {}) {
    const out = [];
    const n = repeat === 'none' ? 1 : Math.max(1, Math.min(52, count));
    const len = U.parseYmd(t.due || t.start) - U.parseYmd(t.start || t.due);
    for (let i = 0; i < n; i++) {
      const s = U.parseYmd(t.start || t.due);
      if (repeat === 'weekly') s.setDate(s.getDate() + 7 * i);
      if (repeat === 'fortnightly') s.setDate(s.getDate() + 14 * i);
      if (repeat === 'monthly') s.setMonth(s.getMonth() + i);
      const e = new Date(s.getTime() + len);
      out.push(Store.make(makeTask({ ...t, start: U.ymd(s), due: U.ymd(e), ticket: n > 1 ? null : t.ticket })));
      Store.entries.push(out[out.length - 1]);
    }
    Store.persist();
    return out;
  }

  /** Cycle Open -> In progress -> Done -> Open, as in the planner. */
  function cycle(id) {
    const e = Store.get(id);
    if (!e) return;
    const next = e.status === 'done' ? 'open' : e.status === 'in-progress' ? 'done' : 'in-progress';
    Store.update(id, { status: next });
  }

  /* ---------------- progress ---------------- */
  function progress(goalId) {
    const ts = tasks(goalId).filter((t) => !t.optional);
    const done = ts.filter((t) => t.status === 'done').length;
    return { total: ts.length, done, pct: ts.length ? Math.round((done / ts.length) * 100) : 0, late: ts.filter(isLate).length };
  }
  function metricProgress(goalId, metric) {
    const ts = tasks(goalId).filter((t) => t.metric === metric && !t.optional);
    return { total: ts.length, done: ts.filter((t) => t.status === 'done').length };
  }
  /** Open tasks whose window overlaps the next `days` days (or are overdue), soonest first. */
  function upcoming(days = 21, { onlyMine = false } = {}) {
    const lim = U.ymd(U.addDays(new Date(), days));
    return tasks().filter((t) => t.status !== 'done' && t.status !== 'skipped' && (t.start || t.due) <= lim && (onlyMine ? mine(t) : true))
      .sort((a, b) => (a.start || a.due).localeCompare(b.start || b.due));
  }
  function nextFor(goalId) { return upcoming(400).find((t) => t.goalId === goalId) || null; }
  function holidaysOn(ymd) { return (data.holidays || []).filter((h) => h.start <= ymd && h.end >= ymd); }
  function inRamadan(ymd) { return !!(data.ramadan && data.ramadan[0] <= ymd && data.ramadan[1] >= ymd); }

  /* ---------------- import / export ---------------- */
  /**
   * Import a goal plan: { format: "opslog-goals", title, goals:[{id,name,short,color,category,metrics:{id:text}}],
   * tasks:[{id,goal,metric,phase,title,detail,owner,start,end,state,optional,ramadan}], holidays, ramadan }.
   * Goals are matched by id; tasks by goal + task id, so importing again updates instead of duplicating.
   */
  function importPlan(json) {
    const p = typeof json === 'string' ? JSON.parse(json) : json;
    if (!p || !Array.isArray(p.goals) || !Array.isArray(p.tasks)) throw new Error('Not a goal plan file (needs "goals" and "tasks")');
    let goals = 0, created = 0, updated = 0;
    p.goals.forEach((g, i) => {
      const metrics = Array.isArray(g.metrics) ? g.metrics : Object.entries(g.metrics || {}).map(([id, name]) => ({ id, name }));
      const existing = get(g.id);
      const merged = Object.assign({ color: COLORS[i % COLORS.length], category: 'other' }, existing || {}, {
        id: g.id, name: g.name, short: g.short || g.name, metrics, color: g.color || (existing && existing.color) || COLORS[i % COLORS.length],
        category: g.category || (existing && existing.category) || 'other', start: g.start || '', end: g.end || '',
      });
      if (existing) Object.assign(existing, merged); else data.goals.push(merged);
      goals++;
    });
    const fresh = [];
    for (const t of p.tasks) {
      if (!get(t.goal)) continue;
      const status = STATE_TO_STATUS[t.state] || (t.done ? 'done' : 'open');
      const ex = Store.entries.find((e) => e.goalId === t.goal && e.ticket === t.id);
      if (ex) {
        Object.assign(ex, { title: t.title, details: t.detail || '', owner: t.owner || '', start: t.start, due: t.end || t.start, metric: t.metric || '', phase: t.phase || '', optional: !!t.optional, ramadan: !!t.ramadan, when: U.parseYmd(t.start).toISOString() });
        if (t.state && ex.status !== status) { ex.status = status; ex.completedAt = status === 'done' ? (t.doneAt || new Date().toISOString()) : null; }
        updated++;
      } else {
        const e = Store.make(makeTask({ goalId: t.goal, metric: t.metric, phase: t.phase, title: t.title, details: t.detail, owner: t.owner, start: t.start, due: t.end || t.start, optional: t.optional, ramadan: t.ramadan, ticket: t.id, status, priority: t.priority }));
        if (status === 'done') e.completedAt = t.doneAt || U.parseYmd(t.end || t.start).toISOString();
        fresh.push(e);
        created++;
      }
    }
    Store.entries.push(...fresh);
    if (p.title) data.title = p.title;
    if (Array.isArray(p.holidays)) data.holidays = p.holidays;
    if (Array.isArray(p.ramadan)) data.ramadan = p.ramadan;
    save();
    return { goals, created, updated };
  }

  function exportPlan() {
    return JSON.stringify({
      format: 'opslog-goals', version: 1, exported: new Date().toISOString(), title: data.title,
      goals: data.goals.map((g) => ({ id: g.id, name: g.name, short: g.short, color: g.color, category: g.category, start: g.start, end: g.end, metrics: Object.fromEntries((g.metrics || []).map((m) => [m.id, m.name])) })),
      tasks: tasks().map((t) => ({ id: t.ticket, goal: t.goalId, metric: t.metric, phase: t.phase, title: t.title, detail: t.details, owner: t.owner, start: t.start, end: t.due, state: STATUS_TO_STATE[t.status] || 'todo', optional: !!t.optional, ramadan: !!t.ramadan, priority: t.priority })),
      holidays: data.holidays, ramadan: data.ramadan,
    }, null, 2);
  }

  const owners = () => [...new Set(tasks().map((t) => t.owner).filter(Boolean))].sort();
  const colorOf = (goalId) => (get(goalId) || {}).color || '#61656b';

  WL.Goals = {
    COLORS, PHASES, list, get, saveGoal, removeGoal, tasks, addTask, cycle, progress, metricProgress, upcoming, nextFor,
    isLate, isActiveOn, mine, holidaysOn, inRamadan, importPlan, exportPlan, owners, colorOf,
    title: () => data.title, setTitle: (t) => { data.title = t; save(); }, data: () => data,
  };
})(window.WL);
