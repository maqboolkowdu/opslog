# OpsLog — A Voice-Driven Work Journal for IT Engineers

> Track every task you do (from a 2-minute MFA reset to a week-long Shibboleth upgrade) with an assistant that **rings you like a phone call** every 30 minutes during working hours. It builds your **daily, weekly, monthly, quarterly and yearly reports** for you.

![Platform](https://img.shields.io/badge/platform-any%20browser-4f6bff) ![Backend](https://img.shields.io/badge/backend-none-8b5cf6) ![Data](https://img.shields.io/badge/data-stays%20on%20your%20device-22c55e)

> **See also:** [**CyberDigest**](https://github.com/maqboolkowdu/cyberdigest), a daily reader of bite-size cyber security news with a GCC focus.

---

## 1. Description

OpsLog is a modern, installable web app (PWA) for a personal record of IT operations work: Active Directory, Entra ID, M365, mail flow, firewall policy, network troubleshooting, Shibboleth, SSL certificates, DMARC, 3rd-party SSO, domain controllers, member servers, service health and so on.

You can type an update or **say it out loud**. OpsLog works out the **area**, **type** (entry, task or job), **status**, **priority**, **time spent** and **ticket number** from what you say:

> *"Reset MFA for a student and revoked all sessions, took 10 minutes, INC0012345"*
> → **MFA & Sessions** · Done · 10m · `INC0012345`

It runs entirely in the browser and needs no server or database. Your data stays on your device.

## 2. Purpose

| Problem | How OpsLog solves it |
|---|---|
| At the end of the week you can't remember half of what you fixed. | An assistant **calls you every 30 minutes** and asks what you did. Answering takes 15 seconds. |
| Small jobs (password resets, unlocks, message traces) never show up in reports. | Every item counts. Reports show *volume* as well as *big projects*. |
| Appraisals, monthly reports and CV updates take hours. | One click gives you a **Day / Week / Month / Quarter / Year** report with charts, a written summary, and Markdown, CSV or PDF export. |
| You want to **showcase** your work without leaking user data. | **Showcase mode** masks e-mail addresses and IPs on screen and in exports. |

## 3. Scenario

> *It's Monday 10:30. You've just finished a mail-flow trace for the Finance team and are halfway through a firewall policy change.*
>
> Your PC rings: **"📞 Ava · OpsLog Assistant — Work check-in · 10:30 AM"**. You click **Answer**:
>
> **Ava:** "Hi Alex, it's Ava. Time for your check-in. What have you worked on since 10:00 AM?"
> **You:** "Traced mail flow for finance, NDR from a partner domain, twenty minutes. Also working on the firewall policy for the vendor VPN."
> **Ava:** "Got it — logged 2 items: Mail Flow, Firewall & Policy as an open task. Anything else?"
> **You:** "That's all."
> **Ava:** "Thanks — 2 items saved. I'll check in again at 11:00 AM."
>
> At **5:00 PM** the last call is the **end-of-day wrap-up**. Ava reads out your day's summary, and on the last working day of the week it opens your **weekly report**. On the last working day of the month, quarter or year it opens those reports too.

---

## 4. Features

- **📞 Phone-call style check-ins**: a full-screen incoming-call screen with ringtone, vibration (on mobile), desktop notification, Answer / Snooze / Decline, and a spoken two-way conversation.
- **⏰ Your working hours built in**: by default Mon–Fri 09:00–12:00 and 13:00–17:00, every 30 minutes. Set your own days and hours in *Settings*.
- **🎙️ Voice or text**: dictate anywhere (quick log, editor, task board) or type during the call.
- **🧠 Auto-classification** into 18 areas: AD, Password Reset, MFA & Sessions, Entra ID, 3rd-party SSO, Shibboleth IdP, SSL/TLS, DMARC/SPF/DKIM, Mail Flow, M365, Firewall & Policy, Security Investigation, Network Config, Connectivity, Domain Controllers, Member Servers, Service Health & Uptime, and Other.
- **🗂️ Entries, tasks and jobs** on a drag-and-drop board (Open → In progress → Blocked → Done).
- **📚 Task Library**: a starter set of 13 recurring IT-ops templates (identity, backups, security and patching, certificates and DNS, service health) with cadence, priority and example PowerShell scripts. Add your own templates, or **import your own library file** with your areas, sites and scripts.
- **🎯 Goals**: goals with metrics and scheduled (optionally repeating) tasks, a progress card per goal, a calendar with deadlines and holidays, and import/export of goal-plan files.
- **⏱️ Focus dial**: Work / Study / Break / Socialize sessions of 15–90 minutes. While one runs, Ava sends quiet chat messages instead of calling.
- **📦 Packages & routines**: bundle library tasks into packages. Routines assign them to you automatically on the days they're due, and the **Today's Routine** page in the left menu tracks them by priority (Critical → Low), with a count badge of open checks.
- **🧭 Pick-from-menu with Ava**: tap ⌨️ during a call and choose from the library, today's due tasks, packages or open checks. No typing needed.
- **📊 Dashboard**: next check-in, a calendar with goal deadlines, your goals, quick log, a "Your day" summary, today's timeline, open tasks and charts.
- **📑 Reports** for Day / Week / Month / Quarter / Year, with a written narrative, charts, time-by-area breakdown, high-impact work, and export to **Markdown, CSV, Print/PDF** or a copied summary.
- **🙈 Showcase mode** masks e-mails and IP addresses.
- **💾 Backup / restore** to and from JSON. **Sample data** is included so you can demo the dashboards straight away.
- **📱 Installable PWA** that works offline and adapts to desktop, tablet and phone in light or dark theme.
- **🪟 Windows helper script** so the check-in still rings when the browser is closed (see section 8).

### Things you can say during a call

| Say… | What happens |
|---|---|
| "Created an AD account for the new starter in Finance, 10 minutes" | Logs a completed **Active Directory** entry with 10m |
| "Need to renew the SSL cert on the VPN gateway by Thursday, high priority" | Creates an **open task**, due Thursday, priority High |
| "Unlocked the director's account. Also patched two member servers, took an hour" | Logs **two** items (split on *also / then / next*) |
| "What did I do today?" / "Summary this week" / "…this month" | Reads out a spoken summary |
| "Open tasks" | Reads your top open tasks |
| "Mark the certificate task done" | Finds the matching open task and closes it |
| "Nothing new" / "That's all" / "Bye" | Ends the call |

### Task Library, packages and routines

**Purpose:** Your recurring operational checks shouldn't depend on memory. The library holds every repeatable task, and routines put the right ones on your list each working day.

**Scenario:** It's Tuesday the 15th and routines are switched on. When you open OpsLog, *Daily checks* assigns the daily templates (backups, alerts, lockouts, service health). *Weekly checks* adds CERT-01 (Tuesdays), and *Monthly checks* adds CERT-02 (15th–21st window). You tick them off on the **Today's Routine** page, or tell Ava *"BKUP-01 and NETS-01 done"* on your 10:30 call.

| You want to… | Do this |
|---|---|
| Pick a task and work on it | **Task Library** → choose an area on the left → **Assign** (open ticket) or ✓ (log as done) |
| Grab several at once | Tick the checkboxes → **Assign to me** / **Log as done** in the bar at the bottom |
| Build a routine | Tick tasks → **Add to package… → New package**, or **Packages & routines → New package**. Choose *Routine* (each task's own schedule), *On selected days*, or *Manual* |
| Run a sweep on demand | Make a *Manual* package (e.g. *VPN tunnel sweep*), then **Run now**, or say *"run tunnel sweep"* on a call |
| Use a PowerShell export | Click **</>** on IAM-03 or IAM-04 to copy the example script (replace the `contoso` OU with yours) |
| Add your own recurring task | **New template** (cadence, weekday or monthly window, priority, site, optional script) |
| Bring your own library | **Import library** with a `.json` library file (areas, templates, scripts, sites, packages). **Export** saves yours |
| Work from the call | Tap **⌨️ Type** → the menu shows *Task library, Due today, Packages, Today's checks, My open tasks* |

Routines are **off** until you turn them on (**Packages & routines → Run routines automatically**). How the schedule works:
- **Daily** tasks are due every working day.
- **Weekly** tasks are due on their weekday.
- **Monthly** tasks are due inside their window (1st–7th, 8th–14th, 15th–21st, 22nd–end), and stay on your list until done or the window ends.

Each period gets its own ticket. If a check from an earlier period is still open when the next one is assigned, the old one is marked **Skipped**, so your board doesn't pile up. Open routine tickets don't count as logged work in reports. Only completed ones do.

---

### Goals: plan the year, schedule the work

**Purpose:** Turn the goals you're appraised on into dated tasks, so each week shows exactly what moves them forward.

**Scenario:** Your manager sets three goals for the year, each with measurable metrics. You enter them once (or import a goal-plan file). The dashboard then shows each goal's progress, the calendar marks deadlines and holidays, and Ava reminds you of goal tasks due this week.

| You want to… | Do this |
|---|---|
| Create a goal | **Goals → New goal**: name, short label, period, colour, and its metrics (one per line, e.g. `2.2 Quarterly privileged access reviews`) |
| Schedule a task | **Schedule a task**: goal, metric, start and due dates, owner, phase. Use **Repeat** (weekly, fortnightly or monthly × N) for recurring work |
| Update progress | Click the square next to a task: Open → In progress → Done. Or tell Ava *"1.1-02 done"* using the task's ID |
| Load an existing plan | **Import plan** (a `.json` goal-plan file). Importing again updates tasks instead of duplicating them |
| Back it up | **Export** saves goals, tasks and progress as a goal-plan file |

Goal tasks scheduled more than a week ahead stay off your task board until they're near. Open goal tasks never count as logged work in reports. Only completed ones do.

> 🔒 Goal plans and task libraries often contain sensitive detail (security findings, server names, sites). Keep them as files you import. **Never commit them to a public repository.**

### Focus dial: protect your concentration

**Purpose:** Block out time for work, study, a break or socialising, without Ava's calls breaking your flow.

**Scenario:** You need 60 minutes to write a PowerShell report. Click the dial in the bottom-right corner and pick **Work · 60**. The page behind blurs and a countdown dial appears. At 10:30 Ava doesn't ring. A quiet chat message slides in instead: *"I held the call. On your list: 5 routine checks, one goal task overdue…"*, with **Reply** and **Later** buttons.

- The dial expands into a 4×4 grid: **Work / Study / Break / Socialize × 15 / 30 / 60 / 90 min**.
- During a session you can **Pause**, add **+5 min** or **End session**. Close the panel (Esc) and the corner dial keeps counting down.
- When the session ends, Ava suggests a break and offers **Log it** to record the session in your work log.
- **Ask Ava** (top bar) opens the same quiet chat at any time: no ringing, no voice, just type or pick from the menu.
- Calls held during focus don't count as missed in your check-in stats.

---

## 5. How to use it (step by step)

### Step 1: Open the app
- **On your PC:** double-click `Start-OpsLog.cmd` and use <http://localhost:8080> (see section 6).
- **Hosted:** publish your copy with GitHub Pages (see section 7) and open `https://<your-user>.github.io/<your-repo>/`.

### Step 2: Install it (recommended)
In **Edge or Chrome**, click the *Install app* icon in the address bar. OpsLog then runs in its own window, which is what the Windows helper looks for.

### Step 3: Personalise
Go to **Settings** and:
1. Enter your **name** (the assistant greets you by it), role, team and your **sites** (e.g. HQ, Branch).
2. Click **Enable desktop notifications**. You'll be alerted while OpsLog is in the background.
3. Set your **Working hours** (days and time windows) and the *Call every* interval.
4. Click **Test incoming call**, then **Answer**, and say something.

> 💡 **Sound needs one click.** Browsers block audio until you interact with the page once. After opening OpsLog, click anywhere (the orange *"Click anywhere to arm call sound"* pill disappears). Keep the tab or app open, minimised if you like.

### Step 4: Log work
- **Answer the calls.** This is the main workflow.
- Use the **Quick log** box on the dashboard (type or 🎙️). A preview shows how it will be classified.
- Click **+ New entry** for full control (area, type, status, priority, time, ticket, due date, tags).
- Click the green **📞** button anytime to call the assistant yourself.
- Keyboard shortcuts: `N` = new entry, `C` = call assistant, `Enter` / `Esc` = answer / decline a ringing call.

### Step 5: Reports and showcase
Open **Reports**, pick *Day / Week / Month / Quarter / Year*, and use ◀ ▶ to move through periods. Then:
- **Print / PDF** gives a clean printable report (sidebar and buttons are hidden).
- **Markdown** is ready to paste into your website, wiki or appraisal.
- **CSV** opens in Excel.
- Turn on **👁 Showcase mode** (top bar) before sharing your screen or exporting.

### Step 6: Back up
**Settings → Export backup (JSON)**. Do this regularly. Data lives in your browser profile, so clearing site data deletes it. **Import backup** restores or merges on another PC.

---

## 6. Run it on your own PC (no GitHub needed)

**Purpose:** Keep OpsLog entirely on your workstation. Nothing is hosted, and it keeps working without internet.

**Scenario:** Your organisation prefers internal tools to stay off public hosting, or you just want OpsLog running from a folder on your laptop like any other admin tool.

OpsLog is a static web app. `tools/Start-OpsLog.ps1` serves it with a tiny built-in web server (.NET `HttpListener`) bound to **localhost only**, so nothing on the network can reach it. You don't need Python, Node or IIS.

> Why not just double-click `index.html`? Browsers treat `http://localhost` as a secure address, so voice input (microphone), notifications, offline mode and **Install app** all work there. From a `file://` path they don't, or they keep asking for permission.

### Step 1: Get the files
- **Download:** on GitHub click **Code → Download ZIP**, then extract it to a permanent folder, e.g. `C:\Tools\OpsLog`.
- **or clone:** `git clone https://github.com/<your-user>/<your-repo>.git C:\Tools\OpsLog`

Files downloaded from the internet are blocked by Windows. Unblock them once:

```powershell
Get-ChildItem C:\Tools\OpsLog -Recurse | Unblock-File
```

### Step 2: Start it
Double-click **`Start-OpsLog.cmd`** in the folder, or run:

```powershell
cd C:\Tools\OpsLog
.\tools\Start-OpsLog.ps1            # serves http://localhost:8080 and opens Edge
```

Keep the window open while you use OpsLog. Press **Ctrl+C** to stop it. In Edge, click **Install app** in the address bar to get OpsLog in its own window.

### Step 3 (recommended): Start it automatically at sign-in

```powershell
.\tools\Start-OpsLog.ps1 -InstallAtLogon     # hidden server at every sign-in
.\tools\Start-OpsLog.ps1 -Uninstall          # remove it again
```

### Step 4: Point the check-in calls at your local copy

```powershell
.\tools\Register-OpsLogCheckins.ps1 -AppUrl "http://localhost:8080/" -Browser Edge -SkipWhenLocked
```

### Moving your data
The browser stores data **per address**, so a hosted copy and `http://localhost:8080/` each have their own data.
1. On the old address: **Settings → Export backup**, **Goals → Export** and **Task Library → Export**.
2. On `http://localhost:8080`: **Settings → Import backup → OK (replace)**, then **Goals → Import plan** and **Task Library → Import library**.

Always use the **same port** (8080 by default). If something else already uses it, start with `-Port 8090` and import your backup there.

| Option | Command |
|---|---|
| Different port | `.\tools\Start-OpsLog.ps1 -Port 8090` |
| Chrome instead of Edge | `.\tools\Start-OpsLog.ps1 -Browser Chrome` |
| Server only, no browser | `.\tools\Start-OpsLog.ps1 -NoBrowser` |
| See each request | `.\tools\Start-OpsLog.ps1 -Verbose` |

> Prefer Python? `python -m http.server 8080` from the OpsLog folder does the same job.

---

## 7. Publish with GitHub Pages

The repo includes `.github/workflows/pages.yml`, which deploys the site on every push to `main`.

1. Make sure the code is on `main`. **Settings → General → Default branch** should be `main`.
2. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Go to **Actions → Deploy OpsLog to GitHub Pages → Run workflow** (or just push to `main`).
4. When the run turns green, the site is live at `https://<your-user>.github.io/<your-repo>/`.

> If the first run fails with *"Get Pages site failed"*, Pages wasn't enabled yet. Do step 2, then re-run the workflow.

> Your work data is **never** uploaded to GitHub. The site is only the app code; entries stay in each browser's local storage.

---

## 8. Make it ring even when the browser is closed (Windows + PowerShell)

Browsers can only ring while the page is open. For a guaranteed "phone call" on your workstation, register the scheduled tasks once:

```powershell
# Run in a normal (non-admin) PowerShell window from the repo's tools folder
Set-ExecutionPolicy -Scope Process Bypass
.\tools\Register-OpsLogCheckins.ps1 -AppUrl "http://localhost:8080/" -Browser Edge -SkipWhenLocked
```

What it does at every slot (by default Mon–Fri 09:00–12:00 and 13:00–17:00, every 30 min; edit `$Windows` in the script to match your hours):
1. Plays a ring and **speaks** *"It's your OpsLog check-in. What have you been working on?"* (Windows SAPI voice).
2. If OpsLog is already open, it brings that window to the front, and the page rings by itself. Otherwise it opens OpsLog in **incoming-call mode** (`?call=1`).
3. With `-SkipWhenLocked` it does nothing while your PC is locked.

Other useful commands:

```powershell
# Test one alert right now
& "$env:LOCALAPPDATA\OpsLog\Invoke-OpsLogCheckin.ps1" -AppUrl "http://localhost:8080/"

# Change the interval to 45 minutes
.\tools\Register-OpsLogCheckins.ps1 -AppUrl "<url>" -IntervalMinutes 45

# Remove everything
.\tools\Register-OpsLogCheckins.ps1 -Unregister
```

The tasks appear in **Task Scheduler → Task Scheduler Library → OpsLog**. To change hours, edit the `$Windows` table at the top of the script, then re-run it.

---

## 9. How it works (for the curious)

```
index.html                 App shell, call screen, editor dialog
assets/css/app.css         Design tokens (light/dark), layout, call UI, print styles
assets/js/util.js          Date helpers, icons, masking, toasts
assets/js/categories.js    18 work areas + keyword classifier  ← add your own keywords here
assets/js/parser.js        Free text → {title, area, type, status, priority, minutes, ticket, due}
assets/js/store.js         localStorage persistence, settings, call log, backup/restore
assets/js/voice.js         Speech synthesis (assistant voice), speech recognition, ringtone
assets/js/agent.js         Work-hours scheduler + phone-call conversation engine
assets/js/library.js       Task Library starter templates, schedule rules, packages & routines, library import/export
assets/js/library-ui.js    Library screen, package builder, Ava's pick-from-menu panel
assets/js/goals.js         Goals, metrics and scheduled goal tasks; progress; plan import/export
assets/js/goals-ui.js      Goals screen, goal/task dialogs, dashboard calendar and goals panel
assets/js/focus.js         Focus dial, timed sessions and Ava's quiet chat messages
assets/js/reports.js       Period ranges, aggregation, narrative, Markdown/CSV export
assets/js/charts.js        Dependency-free SVG charts (donut, bars, heatmap)
assets/js/app.js           Views: Dashboard, Work Log, Tasks, Reports, Settings
sw.js                      Offline cache + notification "Answer / Snooze" buttons
tools/Register-OpsLogCheckins.ps1   Windows scheduled-task "phone call" helper
tools/Start-OpsLog.ps1     Local web server for running OpsLog on your PC (localhost only)
Start-OpsLog.cmd           Double-click launcher for the above
```

**Browser support:** voice input (speech recognition) works in **Chrome, Edge and Safari**. In Firefox you can still answer calls by typing. Everything else works in any modern browser.

## 10. Ideas for later

- Real phone calls or SMS via Twilio / Teams (needs a small serverless backend).
- Sync across devices (OneDrive / SharePoint list / Microsoft Graph).
- Pull ticket data automatically from ServiceNow / Jira.
- Microsoft 365 Copilot-style monthly narrative using an LLM API.

---

*Built for engineers who do a hundred small things a day and deserve credit for every one of them.*
