# Wave 3 — ESPN Live Behavior Trace Runbook

> **FROZEN PRE-LIVE PROCEDURE**
>
> Do not start the ESPN live mock until Phone Command explicitly authorizes it.
>
> Use a disposable ESPN mock only. Never use the user's actual league draft for this experiment.

## Purpose

This runbook defines one controlled live experiment to answer:

**What exactly causes Pick History to become readable, and who causes the observed brief screen switch?**

The required instrumentation baseline is Core forensic timeline main commit:

`8f5dd457630d9325afc838a72ca45179d5a53738`

The experiment must remain observational. Do not redesign reconciliation, change source authority, or add navigation behavior during the run.

Valid findings remain evidence-driven:

- **A — Structured live source is sufficient.** Structured/network/worker observations maintain the live ledger without visible Pick History activation.
- **B — Structured source exists but is incomplete.** Structured/network/worker observations advance, but visible DOM remains necessary to complete or repair picks.
- **C — Pick History remains the practical authority.** No usable source becomes sufficient until Pick History mounts/becomes visible.
- **D — Runtime/version discrepancy.** The observed switch comes from an older/different Companion build, duplicate extension, stale page runtime, or another automation rather than current source.
- **E — Another mechanism.** Evidence shows ESPN itself, an internal component transition, worker boundary, or another mechanism.

Do not force the evidence into a preferred classification.

---

## 1. Required runtime preflight — before entering or starting the disposable mock

The live run is invalid if runtime provenance is uncertain.

### 1.1 Pull current main

On the machine that will run the mock:

```bash
git pull
git status --short
git rev-parse HEAD
```

The required baseline is:

`8f5dd457630d9325afc838a72ca45179d5a53738`

Record:

- exact repository commit
- whether the working tree is clean
- War Room URL/build used
- teams / draft slot / rounds

Do not assume the browser extension matches the repository merely because the displayed version string matches.

### 1.2 Reload the unpacked Companion from the current repo

Open `chrome://extensions` with Developer mode enabled.

Verify:

1. The loaded unpacked folder is the current checkout's `extensions/espn-companion` directory.
2. Exactly one **The War Room — ESPN Draft Companion** is enabled.
3. Record the extension ID and installed version.
4. Press **Reload** on the unpacked Companion **after pulling current main**.
5. Do not enter/start the mock yet.

### 1.3 Refresh ESPN after the extension reload

After reloading the extension:

1. Refresh the ESPN tab.
2. Then open the Companion popup.
3. Confirm ESPN and War Room connectivity/runtime health.
4. If the Companion reports stale MAIN-world capture, refresh ESPN again until the warning clears.

The order is mandatory:

`pull current main → reload unpacked Companion → refresh ESPN tab → open Companion`

Core's MAIN-world observability and forensic instrumentation must be installed into the current ESPN document.

### 1.4 Duplicate-extension / other-automation audit

Before the mock, verify:

- exactly one Companion extension is installed/enabled for the run
- no older Companion copy is enabled under another extension ID
- no Tampermonkey/Violentmonkey userscript affecting ESPN is active
- no macro/click automation is active
- no auto-refresh automation is active
- no DevTools snippet/console automation is running
- no browser/computer-control automation is operating the ESPN tab

Disable unrelated automation capable of clicking, navigating, or switching ESPN views.

### 1.5 Reset the forensic trace

With the current Companion open, press:

**Reset trace**

Wait for the control to report that the trace reset completed.

This reset is **trace-only**. It clears forensic trace storage/page-side forensic rings only. It does **not** clear:

- captured picks
- Companion teams / slot / rounds configuration
- War Room state
- saved draft state
- the active draft ledger

Do not use **Clear captured picks** as a substitute for Reset trace.

The forensic reset establishes a clean recent-event window for the upcoming live transition.

---

## 2. Disposable mock setup

Use only an ESPN mock/practice draft.

Preferred setup:

- PPR
- snake
- 10 teams if available
- 16 rounds
- turn-ish slot if practical

The Companion must already be loaded before entering the draft room.

Before pick 1, confirm War Room and Companion teams / slot / rounds match ESPN.

The user's ESPN pick clock always takes priority over diagnostics. Never miss or rush a pick to collect technical evidence.

Do **not** add extra manual diagnostics during the draft unless something clearly fails.

---

## 3. What Copy Diagnostics now contains

The copied diagnostic output now combines two evidence layers:

1. **Phase-1 A/B observability snapshot + deltas**
2. **Recent forensic timeline**

### 3.1 Phase-1 fields

Preserve these fields from the controlled BEFORE and AFTER copies:

- Pick History DOM state:
  - `absent`
  - `mounted-hidden`
  - `mounted-visible`
- WebSocket observations and delta
- fetch observations and delta
- XHR observations and delta
- EventSource observations and delta
- React observations and delta
- DOM observations and delta
- Worker / SharedWorker boundary counts
- combined Worker/SharedWorker message delta
- REST state / transition
- route changed / same
- ledger count / ledger delta
- latest pick
- confirmed / conflicts / unresolved
- Captured / Applied / Unmatched

The AFTER copy's `Since previous copy:` line must be preserved in full.

Because Copy Diagnostics stores its current observability snapshot as the next baseline, the controlled AFTER copy must be the **immediate next Copy Diagnostics action after BEFORE**.

### 3.2 Recent forensic timeline

The copied output also appends a bounded recent forensic timeline. Preserve it in full.

The timeline can correlate:

- `source-observation`
- `candidate-recognized`
- route/history events
- navigation-click provenance
- `pick-history-dom` transitions
- normalized ESPN `view-change`
- Worker / SharedWorker `worker-message` activity
- `rest-state` transitions
- `ledger-count` / `latest-pick`
- `snapshot-delivery`
- `war-room-ack` / applied changes
- diagnostic markers and relevant rescan markers

Use timing/order across multiple events. Do not promote a single timeline entry into causation by itself.

---

## 4. Navigation-click provenance — required interpretation

The forensic timeline may report navigation click provenance as:

- **`trusted`** — a trusted click means real user input.
- **`untrusted`** — an untrusted click indicates synthetic/browser-script dispatch.
- **`none`** — no recent relevant navigation click was observed.

Do **not** treat any one of these alone as proof of causation.

Always correlate click provenance with:

- route/history events
- visible ESPN view changes
- Pick History DOM transitions
- source/candidate timing
- Worker/SharedWorker activity
- REST changes
- ledger changes
- snapshot delivery
- War Room acknowledgment/applied changes
- the screen recording

For example, `none` plus a visible view transition and `route same` may point toward an internal ESPN component transition, but it does not prove ESPN was the initiator without the rest of the timeline.

---

## 5. Required checkpoints

Keep manual intervention minimal.

### Checkpoint 1 — before pick 1

Record only the essentials:

- normal ESPN starting view
- teams / slot / rounds
- Companion/War Room connected
- Captured / Applied / Unmatched
- current/expected completed
- no runtime warning

Do not manually open Pick History.

### Checkpoint 2 — after first automatic sync

Observe whether the familiar brief switch appears in the verified runtime.

Record:

- whether ESPN visibly changed view
- whether it returned automatically
- whether URL/hash visibly changed
- Captured / Applied / Unmatched after synchronization

Do not add an extra Copy Diagnostics action here if it would disturb the controlled BEFORE/AFTER baseline. The dedicated controlled experiment is the authoritative trace.

### Checkpoint 3 — around pick 10

Perform a brief human sanity check only:

- ESPN picks appear to be advancing
- Captured/Applied are not obviously regressing
- no duplicate ownership is visibly apparent
- no obvious failure banner/runtime warning appears

Do not copy diagnostics unless something clearly fails.

### Checkpoint 4 — controlled transition experiment

Follow section 6 exactly.

### Checkpoint 5 — midpoint

Human sanity check only. Do not add diagnostics unless something clearly fails.

### Checkpoint 6 — final user pick

Confirm the user's final pick is reflected correctly. Do not add diagnostics unless something clearly fails.

### Checkpoint 7 — draft completion

Perform the required final Copy Diagnostics procedure in section 7.

---

## 6. Central controlled transition test — BEFORE / OBSERVE / AFTER

Perform this once when the user is not immediately on the clock.

### BEFORE

1. Remain on the normal ESPN player/draft view.
2. Do **not** manually open Pick History.
3. Do not navigate to Board solely for the experiment.
4. Note the visible ESPN view and browser URL/hash.
5. Open Companion.
6. Click **Copy diagnostics exactly once**.
7. Save the complete output as `CP4-BEFORE`.
8. Do not click Copy Diagnostics again until AFTER.

The BEFORE output is the immediate baseline for the AFTER delta comparison.

Preserve from BEFORE:

- Pick History DOM state
- source observation counts
- Worker/SharedWorker boundary counts
- REST state
- route
- ledger state/latest pick
- Captured / Applied / Unmatched
- recent forensic timeline

### OBSERVE

1. Start or continue one short screen recording around the expected automatic synchronization.
2. Park the mouse in a neutral location.
3. Do not move/click the mouse.
4. Do not press any key.
5. Do not manually open Pick History.
6. Allow the automatic Pick History-like transition to happen naturally.
7. Note whether ESPN visibly changes view.
8. Note whether the URL changes.
9. Note whether the hash changes.
10. Note whether ESPN automatically returns to the previous/main view.
11. Do not interact with Companion until the automatic transition has finished.

If no transition occurs during the selected interval, record that. Do not force one.

### AFTER

Immediately after the automatic transition completes:

1. Open Companion.
2. Click **Copy diagnostics exactly once**.
3. Save the complete output as `CP4-AFTER`.
4. Confirm the output contains the Phase-1 `Since previous copy:` delta line.
5. Confirm the output also contains the recent forensic timeline.

The second copy must remain the immediate diagnostic successor to BEFORE so its A/B deltas correspond to the recorded transition window.

### Required comparison

Compare BEFORE vs AFTER using both the summary deltas and forensic timeline.

| Signal | BEFORE | AFTER / delta |
| --- | --- | --- |
| Visible ESPN view | | |
| Browser URL/hash | | changed / same |
| Pick History DOM | | transition / same |
| WebSocket | | delta |
| fetch | | delta |
| XHR | | delta |
| EventSource | | delta |
| React | | delta |
| DOM | | delta |
| Worker messages | | delta |
| SharedWorker messages | | delta |
| Combined worker | | delta |
| REST | | transition / same |
| Ledger | | delta |
| Latest pick | | |
| Captured / Applied / Unmatched | | |
| Navigation click provenance | | trusted / untrusted / none |
| User mouse/keyboard input | `No` | `No` |

### Timeline correlation target

Use the recent forensic timeline to establish the relative order, where present, of:

1. source observation
2. candidate recognition
3. route/history event
4. navigation-click provenance
5. Pick History DOM transition
6. visible ESPN view transition
7. Worker/SharedWorker message activity
8. REST transition
9. ledger count/latest-pick change
10. snapshot delivery
11. War Room acknowledgment/applied change

The key question is not just **what changed**, but **what changed first and what immediately preceded ledger/application progress**.

---

## 7. Final diagnostic procedure at draft completion

At draft completion:

1. Confirm ESPN shows the draft as complete.
2. Open Companion once.
3. Click **Copy diagnostics once**.
4. Save the complete output as `FINAL-COMPLETION`.
5. Preserve both:
   - the current/final Phase-1 diagnostic state
   - the recent forensic timeline

The final output should be sufficient to verify terminal ledger state, completion behavior, source mix, final delivery, and War Room acknowledgment without collecting repeated manual diagnostics throughout the draft.

Do not add other manual Copy Diagnostics checkpoints unless something clearly fails.

---

## 8. Screen-recording plan

Record one short segment centered on the controlled transition.

The clip should show:

- browser address bar so URL/hash behavior is visible
- ESPN's current view/tab label
- enough of the draft room to see the transition
- the parked mouse pointer

The recording must answer:

1. Was there any user mouse input? — expected **no**.
2. Was there any keyboard input? — expected **no**.
3. Did ESPN visibly enter Pick History or a Pick-History-like view?
4. Did the URL/hash change?
5. Did ESPN return automatically?
6. Did it return to the same prior/main view?

Do not interact with Companion during the transition itself. Take AFTER diagnostics only once the automatic transition has finished.

---

## 9. Attribution guidance

### A — Structured source independently sufficient

Evidence may include:

- Pick History remains absent/hidden
- structured/network/worker source events and candidate recognition advance
- ledger advances
- snapshot delivery and War Room acknowledgment follow
- no visible-history dependency is needed

### B — Structured source exists but visible DOM still matters

Evidence may include:

- structured/network/worker observations occur first
- some candidates/picks remain incomplete
- Pick History DOM/view later activates
- DOM candidate recognition then fills or repairs the ledger

### C — Pick History remains the practical authority

Evidence may include:

- structured/worker/REST evidence is absent, behind, or insufficient
- ledger does not advance adequately before Pick History becomes readable
- Pick History DOM/view activation and DOM candidate recognition directly precede ledger/delivery progress

### D — Runtime/version discrepancy

Evidence may include:

- duplicate Companion copy
- wrong unpacked folder
- stale MAIN-world runtime because ESPN was not refreshed after extension reload
- other automation active
- observed behavior disappears after the runtime is corrected

### E — Another mechanism

Examples include:

- internal ESPN component transition with route unchanged
- route/history transition without a recent navigation click
- worker-boundary activity revealing a different sequence
- another evidence chain not represented by A–D

Do not force classification during the draft. Preserve evidence first.

---

## 10. Existing deterministic coverage — do not duplicate it live

The live mock exists to answer **runtime source timing + transition causality**, not to re-prove deterministic invariants.

Existing automated coverage already protects:

- 717-player War Room integrity
- no pick regression
- no duplicate-player ownership
- conflict repair
- Mine ownership
- reconnect/reload
- completion
- fallback recovery
- Phase-1 observability delta formatting/privacy
- forensic ring bounds/order
- structure-only fingerprints
- Pick History observation non-interference
- click provenance
- pipeline timing derivation
- trace-reset state isolation
- extension permission boundaries

The live run should not duplicate Core's unit work.

---

## 11. Privacy and safety

Privacy rules remain unchanged.

Use a disposable mock only.

Do not save/share:

- passwords
- cookies
- `espn_s2`
- SWID
- authorization headers
- session/access/refresh tokens
- raw credential-bearing requests
- unrelated personal browser content

Core diagnostics sanitize/redact known secrets and route identity, but copied output should still be reviewed before sharing outside the project.

Trim screen recordings to the smallest useful interval and crop/blur unrelated private tabs/account information.

---

## 12. Frozen run record template

Use only after Phone Command explicitly authorizes the live mock.

```text
WAVE 3 LIVE TRACE
Authorized main commit: 8f5dd457630d9325afc838a72ca45179d5a53738
Repo checkout commit:
Working tree clean: YES/NO
War Room URL/build:
Companion extension ID:
Companion installed version:
Loaded unpacked folder verified current: YES/NO
Extension reloaded after pulling main: YES/NO
ESPN tab refreshed after extension reload: YES/NO
Only one Companion enabled: YES/NO
Other browser automation active: NO expected
Trace reset before mock: YES/NO
Trace reset confirmed state-safe: YES/NO
Teams / slot / rounds:
Disposable ESPN mock type:

CP1 BEFORE PICK 1:
CP2 FIRST AUTOMATIC SYNC:
CP3 AROUND PICK 10:

CP4 BEFORE:
Visible view:
URL/hash:
Pick History DOM:
WebSocket observations:
fetch observations:
XHR observations:
EventSource observations:
React observations:
DOM observations:
Worker boundary:
SharedWorker boundary:
REST:
Ledger:
Captured/Applied/Unmatched:
Forensic timeline saved: YES/NO

CP4 OBSERVE:
Mouse input: NO
Keyboard input: NO
Visible transition:
URL changed: YES/NO
Hash changed: YES/NO
Returned automatically: YES/NO
Return view:

CP4 AFTER:
Since previous copy:
Pick History DOM transition:
WebSocket delta:
fetch delta:
XHR delta:
EventSource delta:
React delta:
DOM delta:
Worker delta:
SharedWorker delta:
Combined worker delta:
REST transition:
Route changed/same:
Ledger delta:
Navigation click provenance: trusted / untrusted / none
Captured/Applied/Unmatched:
Recent forensic timeline saved: YES/NO

CP5 MIDPOINT HUMAN SANITY CHECK:
CP6 FINAL USER PICK HUMAN SANITY CHECK:

FINAL-COMPLETION:
Draft complete:
Captured/Applied/Unmatched:
Final ledger/latest pick:
Final REST/source state:
Final forensic timeline saved: YES/NO

FINDING: A / B / C / D / E
EVIDENCE:
UNRESOLVED:
```

---

## 13. Authorization gate

This runbook being frozen does **not** authorize ESPN live testing.

Do not start the disposable mock until Phone Command explicitly authorizes it.
