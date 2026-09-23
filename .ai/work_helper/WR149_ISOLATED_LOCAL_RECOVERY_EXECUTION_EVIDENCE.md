# WR-149 — Isolated local recovery execution: prerequisite blocker

**Task/mode:** Work Helper; CROSS-ROLE RECOVERY limited to a disposable local nonproduction experiment; Workflow V3.5, STANDARD_CHAT_HIGH / FAST_REFRESH. **Result: `BLOCKED_BROWSER_OR_RUNNER`.** **One next Manager recommendation: `REMEDIATE_SPECIFIC_LOCAL_TEST_DEFICIENCY`.** No A → B → A execution, no fixture, no app load, no production/public Pages/provider contact, no browser smoke and no recovery PASS.

## Exact branch and accepted design

On 2026-09-23, the fresh `wr-149-isolated-local-recovery-evidence-execution` branch and `origin/main` were both `e931f3d6a065083072745745432fcc4db8d51efb`, initially 0 ahead/behind and clean. The Manager activation says canonical-main War Room CI **#35905106038 SUCCESS**, Governance **#107330770649 SUCCESS**. Accepted WR-148 PR #416 head `ad4fb06d080398d019aa068b2d0ee4d81b1c04b0` defines the intended local A → benign B → exact A experiment. WR-147 rejects public exposure of historical defective product. No production product tree, fixture A manifest, B manifest or deployment identity was frozen for execution because the mandatory pre-load resources failed first. The accepted WR-143 product origin remains `45cab0c189c284b4a3011b78ce953b99dd857194`; this is background provenance, not a claim about newly measured fixture bytes.

## Pre-load gate observations, no application loaded

At approximately 18:50–18:55 UTC, the container reported UID 0 but `CapEff=0`, `CapBnd=0`, `NoNewPrivs=1`, `Seccomp=2` with one filter. `unshare --user --map-root-user --net true` failed `write failed /proc/self/uid_map: Operation not permitted`; `unshare --net true` failed `Operation not permitted`; `bwrap --unshare-net --ro-bind / / --proc /proc --dev-bind /dev /dev ...` failed `Creating new namespace failed: Operation not permitted`. The current process network namespace was `net:[4026532306]`. `/proc/net/route` listed no IPv4 route beyond its header, `/proc/net/ipv6_route` showed loopback routes. Direct controlled TCP connection probes to **documentation-reserved** `198.51.100.1:443` and `[2001:db8::1]:443` both returned `[Errno 101] Network is unreachable`. No private LAN or provider destination was probed.

The parent environment contains HTTP/HTTPS/ALL proxy variable **names**; values were neither printed nor used in a browser. The absent direct route is useful evidence about this shell, but by itself does **not** certify an app browser and its service worker against a configured proxy or broker. Namespace creation is unavailable. The required browser/service-worker OS/process isolation and negative probes therefore remain **UNVERIFIED**; Playwright request interception could not substitute for them. No local origin was bound and no War Room asset entered Chromium.

`playwright` package exists in the checkout; `chromium.executablePath()` resolved to `/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`, which did not exist. Executable checks found no `/usr/bin/chromium`, `/usr/bin/chromium-browser`, `/usr/bin/google-chrome`, `/opt/google/chrome/chrome` or task-local Chromium. The bounded provisioning attempt used only a disposable destination outside the repository:

```text
PLAYWRIGHT_BROWSERS_PATH=/tmp/wr149-playwright-browser npx playwright install chromium
```

Playwright attempted Chrome for Testing **153.0.8010.12**, browser revision **1243**, from its standard Playwright CDN. Each of five attempts reported `100% of 0 MiB` followed by `End of central directory record signature not found. Either not a zip file, or file is truncated.`; installer exited **1** with `Failed to install browsers` / `Download failure, code=1`. No executable resulted. This is an unavailable download artifact in this environment, not a failed app test. No system package manager, new account, credential, public resource or host firewall change was attempted. The disposable `/tmp/wr149-playwright-browser` directory was removed and absence verified at **2026-09-23T18:54:49Z**. Repository status remained clean before the two documentation edits.

## Checkpoint accounting

| Required checkpoint | Actual result |
| --- | --- |
| Pre-load network/browser gate | **BLOCKED**: no executable Chromium or usable provisioned runner; browser/SW egress restriction not demonstrated. Shell direct-route probes alone are insufficient. |
| BEFORE / A | **NOT STARTED**: no frozen fixture allowlist, Git blob/SHA-256 manifest, local server, tab, service worker, headers, offline or smoke receipt. |
| B CHANGED | **NOT STARTED**: no fixture-only HTML/worker patch, atomic switch, B bytes or browser observations. |
| A RESTORED | **NOT STARTED**: no restoration, manifest comparison or client convergence claim. |
| POST-RESTORE STABILITY | **NOT STARTED**: no stability interval; only failed browser-download path cleanup was verified. |

No fixture binaries, logs, executable harness or generated archive were committed. No local test could produce GitHub Pages Jekyll build/artifact/deploy/status/CDN or production visitor recovery evidence in any event. The experiment's local evidence is **not countable**; there is no PASS pending audit.

## Smallest remediation and future gate

Manager should assign a **separate bounded local-test remediation/execution task** on a disposable runner with a verified Chromium executable (for example, an already available CI runner after its normal browser provisioning) **and** demonstrated OS/container/process-level loopback-only egress for browser **and** service-worker processes. The executor must show enforced restriction and controlled inert negative probes with all proxy paths closed before loading any War Room asset; do not ask the user to weaken a host firewall or supply credentials. A runner merely having Chromium or Playwright route interception does not clear the network gate. Re-freeze then-current accepted A tree, verify full runtime allowlist, and execute the original WR-148 four-checkpoint contract only after both gates pass. A fresh distinct Independent Auditor/QA would review executed immutable receipts if a later run genuinely completes; WR-149 contains none to audit for recovery correctness. Manager retains all Pages/production/A6/release holds.
