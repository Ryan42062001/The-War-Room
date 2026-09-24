# WR-150 — Hosted runner loopback-egress qualification

**Result: `RUNNER_PREFLIGHT_IMPLEMENTATION_SCOPED`. One next Manager recommendation: `AUTHORIZE_ONE_BOUNDED_RUNNER_PREFLIGHT_IMPLEMENTATION`.** This scopes one inert pilot, not an isolation or recovery PASS. WR-150 executed no browser, namespace, CI job, fixture or app.

## Evidence

Fresh branch and canonical main were both `23e24f2f42644b3afdf91fccd65a11bcbe06522a`, 0 ahead/behind. WR-D076 PR #419 was merged; post-activation main CI #35907481462 and Governance #107338729817 succeeded. Accepted WR-148 defines the four-checkpoint loopback-only A → benign B → immutable A local fixture. WR-149 PR #418 head `e2434a2a18a38cb59172f95430b377b5ea8e53b4` ended `BLOCKED_BROWSER_OR_RUNNER` before app load: scratch Chromium download failed and namespace creation was denied.

Actual FULL CI #35885632498 product job #107265099200 logged GitHub-hosted Ubuntu 24.04.5, image `ubuntu-24.04` version `20260920.314.1`, runner 2.337.0, read-only Contents token, successful Playwright Chromium headless shell 153.0.8010.12 revision 1243 download and repeated browser tests including `WR136_TERMINAL_TURN_REPAIR_PASS`. This proves browser availability **for that run**, not outbound isolation or reservation of its VM. The current `.github/workflows/ci.yml` handles push/PR, and its FULL test job runs only when classifier/Governance permit. It has no arbitrary diagnostic command dispatch. `scripts/test-browser.mjs` loads the real app; Playwright request interception is not an OS boundary.

GitHub documents passwordless sudo on Linux hosted VMs and default PR checkout of a synthetic merge commit: https://docs.github.com/en/actions/reference/runners/github-hosted-runners and https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target . Namespace creation, `ip` availability, Chromium in a namespace and service-worker denial on a future runner remain **UNVERIFIED**.

## Exactly one proposed future pilot

Separately authorize and independently audit an implementation PR changing only `.github/workflows/ci.yml` and adding `scripts/wr150-loopback-netns.sh` and `scripts/wr150-loopback-preflight.mjs`. One disposable GitHub-hosted `ubuntu-latest` job, normal `npm ci` and `npx playwright install --with-deps chromium` provisioning, and one short inert preflight are the bounded resource budget. No private runner, credentials, laptop action, external site, product file, existing test edit or artifact containing environment values.

Add a dedicated PR job restricted to the same repository and designated audited pilot branch, `permissions: {contents: read}`, no secrets, deployment or `pull_request_target`. Do not presume `workflow_dispatch` works from an unmerged branch. Checkout explicit `${{ github.event.pull_request.head.sha }}` and assert `git rev-parse HEAD` equals that immutable value; log both head and synthetic merge-ref identities. Independently audit exact workflow/scripts/head **before first executable trigger**; opening or pushing a PR can run jobs automatically, so Manager must authorize that first inert run and stage the branch/trigger accordingly. Reject external-fork executable code in a sudo job. Do not interpret ordinary FULL CI as the pilot.

Install browser before isolation. In the shell wrapper, require `sudo` and `ip`, create a fresh `sudo ip netns add` namespace (or equivalent `sudo unshare --net` child), bring up **only** its loopback interface, and run the entire Node/Playwright process tree there as an unprivileged user. No veth, bridge, default route, DNS uplink or forwarded socket. Scrub uppercase/lowercase HTTP/HTTPS/ALL proxy and NO_PROXY variables and broker-related network settings, launch Chromium direct with a fresh empty profile, close inherited nonstandard descriptors, and exclude any host-loopback proxy/Unix-socket forwarding broker. The network namespace, never Playwright routing, is the enforcement boundary. If sudo/namespace isolation is unavailable, stop before any page load.

Before any War Room byte is loaded, capture parent/child namespace inodes, UID/capability state, interfaces and IPv4/IPv6 routes, proxy variable **names only**, Chromium/network/service-worker PIDs and their namespace inodes. Every observed child must share the isolated namespace. In it serve only an inert fixture bound to `127.0.0.1` on an ephemeral port. Positively demonstrate page, controlling activated service worker and localhost fetch. Negatively attempt short-timeout page **and service-worker-originated** fetches to documentation-reserved `198.51.100.1:443` and `[2001:db8::1]:443`; repeat with deliberately set proxy variables to prove namespace denial is the backstop. Record each failure and absence of redirect/success. A shell direct-route negative is ancillary. No DNS name, ESPN/provider address, real data or War Room content in the pilot.

Fail closed on missing process/SW receipt, any escaped child or broker, ambiguous proxy path, unexpected network success, changed route, Chromium/worker launch failure, timeout or failed cleanup. Kill descendants and remove namespace, profile and fixture; retain sanitized exact-head run/job logs and teardown receipt for distinct Independent Auditor and Manager. A successful preflight would qualify only a separately authorized future WR-148 A/B/A execution with independent QA. It cannot prove Pages build/artifact/deploy/CDN, production visitor convergence, A6 or release. If this **one pilot** fails, return `NO_QUALIFIED_RUNNER`, defer the local surrogate and preserve the production recovery gap for later A6.

## Alternatives

| Route | Finding |
| --- | --- |
| Minimal first-party hosted CI preflight | Browser install historically verified and GitHub documents sudo; the small audited namespace job is credible but **unexecuted**. |
| Already available zero-change disposable CI | No arbitrary command trigger or isolation receipt in existing workflow; unavailable for this proof. |
| Defer local surrogate | Correct fallback if pilot cannot establish browser and worker confinement; production limitation remains explicit. |

No production/Pages modification, provider contact, Track B, 2027 ranking import or release decision is authorized.
