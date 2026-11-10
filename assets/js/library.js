/* OpsLog — Task Library (templates from the IT & Network Operations dashboard),
   packages of templates and routines that assign them automatically. */
(function (WL) {
  'use strict';
  const { U, Store } = WL;

  const WINDOWS = { '1-7': [1, 7], '8-14': [8, 14], '15-21': [15, 21], '22-31': [22, 31] };
  const WINDOW_LABEL = { '1-7': '1st–7th', '8-14': '8th–14th', '15-21': '15th–21st', '22-31': '22nd–end of month' };
  const PRIORITY = { critical: 'critical', high: 'high', medium: 'normal', normal: 'normal', low: 'low' };

  // d = daily, w<n> = weekly on weekday n (0 = Sunday), m<window> = monthly window
  const T = (id, title, sched, priority, location) => ({ id, title, sched, priority, location: location || '' });

  /* A small, generic starter set. Import your own library (Task Library → Import) for the rest. */
  const BUILT_IN = [
    { id: 'identity', name: 'Identity & Access', category: 'ad',
      purpose: 'Keep accounts accurate and access minimal, so everyone has exactly what they need and nothing more.',
      scenario: 'A wave of joiners and leavers lands at the start of term; stale accounts quietly widen the attack surface if nobody cleans them up.',
      tasks: [
        T('IAM-01', 'Review account lockouts and the password-expiry queue; action stuck requests', 'd', 'medium'),
        T('IAM-02', 'Process joiner, mover and leaver account requests', 'd', 'medium'),
        T('IAM-03', 'Audit stale or disabled accounts with no logon in 90+ days', 'w1', 'low'),
        T('IAM-04', 'Review privileged group membership for unexpected or stale members', 'm1-7', 'high'),
      ] },
    { id: 'backups', name: 'Backups & Recovery', category: 'backup',
      purpose: 'Make sure backups complete every night and can actually be restored.',
      scenario: 'A file server fails or ransomware hits; the backup is only as good as the last time someone proved it restores.',
      tasks: [
        T('BKUP-01', "Confirm last night's backup jobs completed successfully", 'd', 'critical'),
        T('BKUP-02', 'Test-restore a sample file or VM', 'w5', 'high'),
        T('BKUP-03', 'Review backup storage capacity and retention policy', 'm22-31', 'medium'),
      ] },
    { id: 'security', name: 'Security & Patching', category: 'security',
      purpose: 'Triage alerts quickly and keep systems patched before vulnerabilities are exploited.',
      scenario: 'A critical vulnerability is announced on Tuesday; unpatched servers are the first thing automated scanners find.',
      tasks: [
        T('SECP-01', 'Triage critical and high-severity security alerts', 'd', 'high'),
        T('SECP-02', 'Check for newly disclosed critical or zero-day patches', 'd', 'high'),
        T('SECP-03', 'Monthly patch cycle: test, schedule and deploy updates', 'm8-14', 'high'),
      ] },
    { id: 'web', name: 'Certificates & DNS', category: 'ssl',
      purpose: 'Avoid outages from expired certificates and stale or wrong DNS records.',
      scenario: "A public site's certificate expires over the weekend and users see browser warnings on Monday morning.",
      tasks: [
        T('CERT-01', 'Scan public sites and services for certificates expiring within 30 days', 'w2', 'high'),
        T('CERT-02', 'Review public DNS records and remove stale entries', 'm15-21', 'low'),
      ] },
    { id: 'services', name: 'Service Health', category: 'monitoring',
      purpose: 'Catch outages before users do.',
      scenario: 'A site-to-site link drops overnight; a quick morning check finds it before the helpdesk queue does.',
      tasks: [
        T('NETS-01', 'Check that core services, links and VPN tunnels are up; review monitoring alerts', 'd', 'high'),
      ] },
  ];

  /* Example PowerShell scripts attached to starter templates. Replace the OU with your own. */
  const OU = 'OU=Staff,DC=contoso,DC=com';
  const SCRIPTS = {
    'IAM-03': { name: 'Export stale and disabled accounts (90+ days)',
      purpose: 'Lists every account with no logon in 90+ days, or already disabled, as a CSV to review.',
      code: `Import-Module ActiveDirectory

# Accounts with no logon in 90+ days, or with no recorded logon at all
$OU = "${OU}"   # change to your own OU
$Cutoff = (Get-Date).AddDays(-90)
$OutFile = "$env:USERPROFILE\\Desktop\\AD_Stale_Accounts_$(Get-Date -Format 'yyyy-MM-dd').csv"

Get-ADUser -Filter * -SearchBase $OU -Properties LastLogonDate,Enabled |
    Where-Object { $_.LastLogonDate -lt $Cutoff -or -not $_.LastLogonDate } |
    Select-Object Name,SamAccountName,Enabled,LastLogonDate,DistinguishedName |
    Export-Csv -Path $OutFile -NoTypeInformation -Encoding UTF8

Write-Host "Exported to $OutFile"` },
    'IAM-04': { name: 'Export privileged group membership',
      purpose: 'Lists the members of the built-in privileged groups so you can spot anyone who should not be there.',
      code: `Import-Module ActiveDirectory

$Groups = "Domain Admins","Enterprise Admins","Schema Admins"
$OutFile = "$env:USERPROFILE\\Desktop\\AD_Privileged_Groups_$(Get-Date -Format 'yyyy-MM-dd').csv"

$Groups | ForEach-Object {
    $GroupName = $_
    Get-ADGroupMember -Identity $GroupName -Recursive |
        Get-ADUser -Properties DisplayName,Enabled,LastLogonDate |
        Select-Object @{N='Group';E={$GroupName}},DisplayName,SamAccountName,Enabled,LastLogonDate
} | Export-Csv -Path $OutFile -NoTypeInformation -Encoding UTF8

Write-Host "Exported to $OutFile"` },
  };

  /* ---------------- storage ---------------- */
  const K_CUSTOM = 'opslog:library:custom:v1';
  const K_AREAS = 'opslog:library:areas:v1';
  const K_PKG = 'opslog:packages:v1';
  const read = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { U.toast('Could not save — browser storage is full or blocked', 'error'); } };

  let custom = read(K_CUSTOM, []); // [{id, areaId, title, sched, priority, location, script?}]
  let imported = read(K_AREAS, []); // areas loaded from a library file
  const CUSTOM_AREA = { id: 'custom', name: 'My templates', category: 'other', custom: true,
    purpose: 'Your own reusable tasks. Add anything you do repeatedly so it can be assigned in one click or bundled into a routine.',
    scenario: 'You run the same meeting-room check before every board meeting — save it once and assign it whenever the meeting is on the calendar.' };

  function areas() {
    const base = BUILT_IN.filter((a) => !imported.some((i) => i.id === a.id)).concat(imported);
    const list = base.map((a) => ({ ...a, tasks: a.tasks.concat(custom.filter((c) => c.areaId === a.id)) }));
    list.push({ ...CUSTOM_AREA, tasks: custom.filter((c) => c.areaId === 'custom' || !base.some((a) => a.id === c.areaId)) });
    return list;
  }
  function all() { return areas().flatMap((a) => a.tasks.map((t) => ({ ...t, area: a }))); }
  function get(id) { return all().find((t) => t.id.toUpperCase() === String(id).toUpperCase()) || null; }

  /** The PowerShell (or other) script attached to a template, if any. */
  function scriptFor(id) {
    if (SCRIPTS[id]) return SCRIPTS[id];
    const t = get(id);
    if (!t || !t.script) return null;
    return typeof t.script === 'string' ? { name: `${t.id} script`, purpose: '', code: t.script } : t.script;
  }

  /** Sites / campuses: from Settings plus any used by templates. */
  function locations() {
    return [...new Set([...(Store.settings.locations || []), ...all().map((t) => t.location).filter(Boolean)])];
  }

  /* ---------------- library files (import / export) ---------------- */
  /**
   * { format: "opslog-library", locations:[...], areas:[{id,name,category,purpose,scenario,tasks:[{id,title,sched,priority,location,script}]}],
   *   custom:[...], packages:[{id,name,mode,days,auto,templateIds}] }
   * Areas, templates and packages are matched by id, so importing again updates instead of duplicating.
   */
  function importLibrary(json) {
    const p = typeof json === 'string' ? JSON.parse(json) : json;
    if (!p || (!Array.isArray(p.areas) && !Array.isArray(p.packages) && !Array.isArray(p.custom))) throw new Error('Not a task library file (needs "areas" or "packages")');
    let nA = 0, nT = 0, nP = 0;
    (p.areas || []).forEach((a) => {
      if (!a.id || !Array.isArray(a.tasks)) return;
      const area = { id: String(a.id), name: a.name || a.id, category: a.category || 'other', purpose: a.purpose || '', scenario: a.scenario || '',
        tasks: a.tasks.filter((t) => t.id && t.title && t.sched).map((t) => ({ id: t.id, title: t.title, sched: t.sched, priority: t.priority || 'medium', location: t.location || '', script: t.script || undefined })) };
      const i = imported.findIndex((x) => x.id === area.id);
      if (i >= 0) imported[i] = area; else imported.push(area);
      nA++; nT += area.tasks.length;
    });
    (p.custom || []).forEach((c) => { if (!c.id) return; const i = custom.findIndex((x) => x.id === c.id); if (i >= 0) custom[i] = c; else custom.push(c); nT++; });
    (p.packages || []).forEach((pk) => {
      if (!pk.id || !Array.isArray(pk.templateIds)) return;
      const ex = packages.find((x) => x.id === pk.id);
      const merged = { id: pk.id, name: pk.name || pk.id, mode: pk.mode || 'manual', days: pk.days || [], auto: !!pk.auto, templateIds: pk.templateIds, lastRun: ex ? ex.lastRun : null };
      if (ex) Object.assign(ex, merged); else packages.push(merged);
      nP++;
    });
    if (Array.isArray(p.locations) && p.locations.length) Store.saveSettings({ locations: [...new Set([...(Store.settings.locations || []), ...p.locations])] });
    write(K_AREAS, imported); write(K_CUSTOM, custom); write(K_PKG, packages);
    Store.persist();
    return { areas: nA, templates: nT, packages: nP };
  }

  function exportLibrary() {
    return JSON.stringify({
      format: 'opslog-library', version: 1, exported: new Date().toISOString(),
      locations: Store.settings.locations || [], areas: imported, custom,
      packages: packages.map(({ lastRun, ...pk }) => pk),
    }, null, 2);
  }

  /* ---------------- schedule maths ---------------- */
  const cadence = (t) => (t.sched === 'd' ? 'daily' : t.sched[0] === 'w' ? 'weekly' : t.sched[0] === 'm' ? 'monthly' : 'ad-hoc');
  const weekday = (t) => Number(t.sched.slice(1));
  const windowOf = (t) => WINDOWS[t.sched.slice(1)];
  function scheduleLabel(t) {
    const c = cadence(t);
    if (c === 'daily') return 'Every day';
    if (c === 'weekly') return U.DAYS[weekday(t)] + 's';
    if (c === 'monthly') return WINDOW_LABEL[t.sched.slice(1)];
    return 'On demand';
  }
  function isDue(t, date) {
    const c = cadence(t);
    if (c === 'daily') return true;
    if (c === 'weekly') return date.getDay() === weekday(t);
    if (c === 'monthly') { const [a, b] = windowOf(t); return date.getDate() >= a && date.getDate() <= b; }
    return false;
  }
  function periodKey(t, date) {
    if (cadence(t) === 'monthly') return `${date.getFullYear()}-${U.pad(date.getMonth() + 1)}-M${t.sched.slice(1)}`;
    return U.ymd(date);
  }
  /** Last day of the template's current window (monthly) or the day itself. */
  function dueDate(t, date) {
    if (cadence(t) !== 'monthly') return U.ymd(date);
    const [, b] = windowOf(t);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    return U.ymd(new Date(date.getFullYear(), date.getMonth(), Math.min(b, last)));
  }

  /** The latest instance (entry) of a template for the period containing `date`. */
  function instance(t, date = new Date()) {
    const key = periodKey(t, date);
    return Store.entries.find((e) => e.templateId === t.id && e.periodKey === key) || null;
  }

  /* ---------------- assigning ---------------- */
  function toEntry(t, date, source) {
    const now = new Date();
    const when = U.sameDay(date, now) ? now : new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, 0);
    return {
      title: t.title, details: `${t.id} · ${t.area.name} · ${scheduleLabel(t)}`, category: t.area.category,
      type: 'task', status: 'open', priority: PRIORITY[t.priority] || 'normal', ticket: t.id, location: t.location || '',
      tags: [cadence(t)], due: dueDate(t, date), when: when.toISOString(), source,
      templateId: t.id, periodKey: periodKey(t, date),
    };
  }

  /**
   * Assign templates to yourself for `date`. Skips any template already assigned for that period.
   * When an older open copy of the same template exists, it is marked "skipped" (superseded).
   * opts.status = 'done' logs them as completed instead.
   */
  function assign(ids, { date = new Date(), source = 'library', status = 'open' } = {}) {
    const created = [], existing = [], updated = [];
    const fresh = [];
    for (const id of ids) {
      const t = get(id);
      if (!t) continue;
      const inst = instance(t, date);
      if (inst) {
        if (status === 'done' && inst.status !== 'done') { Store.update(inst.id, { status: 'done' }); updated.push(inst); }
        else existing.push(inst);
        continue;
      }
      const data = toEntry(t, date, source);
      if (status === 'done') data.status = 'done';
      fresh.push(data);
    }
    if (fresh.length) {
      const keys = new Set(fresh.map((f) => f.templateId));
      Store.entries.forEach((e) => {
        if (keys.has(e.templateId) && e.status !== 'done' && e.status !== 'skipped') { e.status = 'skipped'; e.updated = new Date().toISOString(); }
      });
      created.push(...Store.addMany(fresh));
    }
    return { created, existing, updated };
  }

  /* ---------------- custom templates ---------------- */
  function nextCustomId() {
    let n = custom.length + 1;
    while (custom.some((c) => c.id === `MY-${U.pad(n)}`)) n++;
    return `MY-${U.pad(n)}`;
  }
  function saveTemplate(tpl) {
    const i = custom.findIndex((c) => c.id === tpl.id);
    if (i >= 0) custom[i] = tpl; else custom.push({ ...tpl, id: tpl.id || nextCustomId() });
    write(K_CUSTOM, custom);
    Store.persist();
  }
  function removeTemplate(id) {
    custom = custom.filter((c) => c.id !== id);
    write(K_CUSTOM, custom);
    packages.forEach((p) => { p.templateIds = p.templateIds.filter((x) => x !== id); });
    write(K_PKG, packages);
    Store.persist();
  }

  /* ---------------- packages & routines ---------------- */
  // mode: 'cadence' = follow each template's own schedule (a routine)
  //       'days'    = assign every template in the package on the chosen weekdays
  //       'manual'  = only when you run it
  let packages = read(K_PKG, null);
  if (!packages) {
    const by = (c) => BUILT_IN.flatMap((a) => a.tasks).filter((t) => cadence(t) === c).map((t) => t.id);
    packages = [
      { id: 'pkg-daily', name: 'Daily checks', mode: 'cadence', days: [], auto: true, templateIds: by('daily'), lastRun: null },
      { id: 'pkg-weekly', name: 'Weekly checks', mode: 'cadence', days: [], auto: true, templateIds: by('weekly'), lastRun: null },
      { id: 'pkg-monthly', name: 'Monthly checks', mode: 'cadence', days: [], auto: true, templateIds: by('monthly'), lastRun: null },
    ];
    write(K_PKG, packages);
  }
  const savePackages = () => { write(K_PKG, packages); Store.persist(); };
  function savePackage(p) {
    const i = packages.findIndex((x) => x.id === p.id);
    if (i >= 0) packages[i] = p; else packages.push({ ...p, id: p.id || 'pkg-' + U.uid() });
    savePackages();
  }
  function removePackage(id) { packages = packages.filter((p) => p.id !== id); savePackages(); }

  /** Templates of a package that are due on `date` under the package's mode. */
  function dueInPackage(p, date, { force = false } = {}) {
    const ids = p.templateIds.filter((id) => get(id));
    if (force || p.mode === 'manual') return ids;
    if (p.mode === 'days') return p.days.includes(date.getDay()) ? ids : [];
    return ids.filter((id) => isDue(get(id), date));
  }

  /** Run a package now. Manual runs assign everything in it; routines assign what is due. */
  function runPackage(p, { date = new Date(), force = false, source = 'routine' } = {}) {
    const ids = dueInPackage(p, date, { force });
    const res = assign(ids, { date, source });
    p.lastRun = U.ymd(date);
    savePackages();
    return res;
  }

  function isWorkday(date) { return WL.Agent ? WL.Agent.slotsFor(date).length > 0 : true; }

  /** Auto-assign routines for today (idempotent: templates already assigned are skipped). */
  function autoRun(date = new Date()) {
    if (Store.settings.routinesEnabled === false) return [];
    const created = [];
    for (const p of packages) {
      if (!p.auto || p.mode === 'manual') continue;
      if (p.mode === 'cadence' && !isWorkday(date)) continue;
      const ids = dueInPackage(p, date);
      if (!ids.length) continue;
      const res = assign(ids, { date, source: 'routine' });
      if (res.created.length) { p.lastRun = U.ymd(date); created.push(...res.created); }
    }
    if (created.length) savePackages();
    return created;
  }

  /** Templates due today that are not yet assigned (across the whole library). */
  function dueToday(date = new Date()) {
    return all().filter((t) => isDue(t, date) && !instance(t, date));
  }

  /** Today's routine/library tickets (the "Today's Focus" list). */
  function todays(date = new Date()) {
    const ymd = U.ymd(date);
    return Store.entries.filter((e) => e.templateId && e.status !== 'skipped' &&
      (e.due === ymd || (e.periodKey && e.periodKey.includes('-M') && e.status !== 'done' && e.due >= ymd) || (e.status === 'done' && e.completedAt && U.ymd(new Date(e.completedAt)) === ymd)));
  }

  /** Find template ids written in free text, e.g. "AD-03 and fgt-07". */
  function idsIn(text) {
    const out = [];
    (String(text).match(/\b[A-Z][A-Z0-9]{1,5}-\d{2}\b/gi) || []).forEach((m) => { const t = get(m); if (t && !out.includes(t.id)) out.push(t.id); });
    return out;
  }
  function findPackage(text) {
    const q = String(text).toLowerCase();
    let best = null, score = 0;
    for (const p of packages) {
      const words = p.name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
      const s = words.filter((w) => q.includes(w)).length;
      if (s > score) { best = p; score = s; }
    }
    return score ? best : null;
  }

  WL.Library = {
    get LOCATIONS() { return locations(); }, WINDOW_LABEL, PRIORITY, areas, all, get, cadence, scheduleLabel, isDue, periodKey, instance,
    assign, saveTemplate, removeTemplate, nextCustomId, scripts: SCRIPTS, scriptFor, locations, importLibrary, exportLibrary,
    packages: () => packages, savePackage, removePackage, runPackage, dueInPackage, autoRun, dueToday, todays,
    idsIn, findPackage, isWorkday,
  };
})(window.WL);
