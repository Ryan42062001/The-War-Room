# WR-146 — Pages deployment identity and rollback preconditions

**Assignment:** DIAGNOSIS ONLY, Workflow V3.5. No deploy, rollback, restore, Pages mutation, live ESPN, provider contact, A6 decision or release.  
**Read-only observation:** 2026-09-23T17:41–17:46Z UTC.  
**Canonical `main` and initial branch:** `bcb2e89d0da0e1768b8f8688c95f45c53cc49a85`, 0 ahead / 0 behind.  
**Overall result: DEPLOYMENT_IDENTITY_ESTABLISHED.**

## Deployment mechanism and exact record

The public GitHub deployments endpoint for environment `github-pages` returned latest deployment **ID 6620402111**, `ref: main`, immutable `sha: bcb2e89d0da0e1768b8f8688c95f45c53cc49a85`, created 2026-09-23T17:36:37Z. Status **ID 18742619364 SUCCESS** at 17:37:14Z binds environment URL `https://ryan42062001.github.io/The-War-Room/` and [Pages run #35896736306](https://github.com/Ryan42062001/The-War-Room/actions/runs/35896736306), deploy job **#107302562693**. Its build job **#107302424025 SUCCESS** and report-build-status **#107302562666 SUCCESS** are separate from War Room product CI #35896736798.

The Pages run metadata says `name: pages build and deployment`, `path: dynamic/pages/pages-build-deployment`, `event: dynamic`, `head_branch: main`, exact `head_sha: bcb2e89d...`, conclusion SUCCESS. Decoded build log checks out **`ref: main`**, records checkout commit `bcb2e89d...`, invokes `actions/jekyll-build-pages@v1` with **`source: .`**, `destination: ./_site`, `build_revision: bcb2e89d...`, and uploads the artifact. The repository has no checked-in Pages deployment workflow; this is GitHub's generated Pages branch-source build, not an app-controlled Actions Pages workflow. **Source branch `main`; source folder repository root `.`; high confidence from the actual build inputs.** The unauthenticated Pages settings and latest-build endpoints returned HTTP 404, so their administrative configuration fields remain `UNVERIFIED_DUE_TO_CAPABILITY`, but the executed mechanism/source is observable from the successful dynamic run. No user credential or token was used.

Read-only source URLs: [deployment 6620402111](https://api.github.com/repos/Ryan42062001/The-War-Room/deployments/6620402111), [statuses](https://api.github.com/repos/Ryan42062001/The-War-Room/deployments/6620402111/statuses), [build run](https://github.com/Ryan42062001/The-War-Room/actions/runs/35896736306), [public app](https://ryan42062001.github.io/The-War-Room/). The latest-deployment query was repeated at 17:45:49Z and still returned ID 6620402111. It is a time-bound observation, not a promise that no subsequent deployment will occur.

## Served bytes and candidate identity

An unauthenticated HTTPS GET of actual Pages `index.html` returned HTTP 200, `server: GitHub.com`, `last-modified: Wed, 23 Sep 2026 17:37:03 GMT`, `etag: "6ab40e3f-491f"`, `cache-control: max-age=600`. That timing is consistent with the successful 17:37:14Z deployment but is not independently an SHA marker. Read-only GETs with a diagnostic query string retrieved **29 runtime assets** (app shell, script/config, all directly loaded/dynamically referenced JS/CSS, dataset/board, service worker and favicon). Every served byte sequence equals the corresponding immutable blob at `bcb2e89d...`: **29/29 exact byte matches**. The sorted manifest uses lines `path + single space + SHA-256(hex) + newline`, UTF-8, and has SHA-256 **`d98e7b891cf673e8933744b9ee3ac35120bccf316450a08e4041b0f30b33a1e6`**. The manifest below contains every checked path and hash.

Critical discriminator: served `js/war-room-command-bar.js` Git blob **`bdab730bd2ce84263c49c05569a9d1229332bc7f`** equals the accepted WR-143 production blob at `45cab0c189c284b4a3011b78ce953b99dd857194`; pre-WR-143 canonical `c8c03bdb0b0880ce8dc6d1fa2d6acf19b498fb91` has different blob **`a85bc1483aeb621274a2ef29ed1a77a22f8e6140`** with the old `myNextPick === null` completion shortcut. `index.html`, `script.js`, `war-room-config.js`, `js/war-room-ui.js`, `js/war-room-espn-sync.js` and `service-worker.js` also match the current immutable repository blobs. The served service worker cache name is `war-room-shell-20260910-3`, a cache version string, **not** an immutable commit marker; it uses network-first GET and offline cache fallback.

**Do not infer a unique SHA from bytes alone:** accepted product integration `45cab0c...` and subsequent canonical documentation-only `9de14670618f7ed19a814c3b43cebce01bd05d61`, `396fd69a276720d66f42a4785e03286f498dc55b`, `82d4add25aab57efe1fa05d1f79e652d7d48a1cd`, and `bcb2e89d...` have identical checked product assets. The separate successful Pages deployment record uniquely binds the latest deployed build to **`bcb2e89d...`** at observation time. The accepted product content originates at **`45cab0c...`**. This 29-file runtime manifest is a checked asset set, not a claim that every repository file or every possible dynamic route was fetched.

For a later exact-current live fallback: pin both the deployment **SHA `bcb2e89d...`/ID 6620402111** and this served runtime manifest, then re-read deployment status and critical served bytes at the time of the test; verify browser service-worker controller/cache and loaded asset responses to exclude an offline/stale client. Canonical repository HEAD is `bcb2e89d...` now but may advance. Latest accepted product integration is `45cab0c...`. The app has no observed served commit marker; Companion manifest version is **0.9.14** in the repository and must be verified on the actually installed extension during a future test. Do not collapse these identities.

## Rollback/restore preconditions — no execution

Before separate prospective Manager authorization, retain: (1) current deployment ID/SHA/status and the 29-file served manifest; (2) a **qualified prior known-good immutable target** with exact tree and accepted test/incident history; (3) the demonstrated dynamic Pages build source `main`/root and an authorized, guarded method to change it without force-push; (4) a maintenance window and expectations for Pages build/propagation, `max-age=600` CDN headers, browser caching and the network-first/offline service worker; (5) independent post-change deployment ID/status and byte-manifest verification including the discriminating command-bar blob; (6) bounded smoke checks of app load, settings, manual Taken/Mine, persistence and sync boundary without ESPN/provider action; (7) immutable restoration target `bcb2e89d...` or a newly reverified Manager-approved current candidate, plus success/status/served-byte checks after restoration; (8) before/during/after UTC receipts, run/job/deployment IDs, SHA, response headers, manifest digests and errors.

An older canonical candidate such as `c8c03bdb...` is **materially distinct** and had accepted production coverage, but contains the retained LOW WR137-F01 false completion and is **not automatically qualified as known-good for all current behavior**. A documentation-only prior SHA is byte-identical and would not prove a material rollback. Manager must choose and qualify a bounded target and stop conditions prospectively. Abort/escalate if source, deployment status, served bytes or browser controller disagree; if a build fails or propagation remains ambiguous, do not claim rollback/restore success or proceed to live validation. This report does not trigger any branch update or deployment.

## One next Manager recommendation

**ROLLBACK_RESTORE_REHEARSAL_READY_FOR_SEPARATE_AUTHORIZATION.** Deployment mechanism, current identity and measurable before/after checks are established. A separate Manager task must qualify the prior target and authorize a controlled rehearsal with exact guardrails; WR-146 itself performs none. A read-only Pages settings screenshot is optional corroboration of the observed `main`/root build inputs, **not required** to resolve the current deployment identity. No live ESPN fallback or formal A6 is recommended at this gate.

## Served runtime manifest (path, SHA-256)

| Path | SHA-256 of served bytes |
| --- | --- |
| `command-bar.css` | `1f54cb4259d4ed555cc0e242dfd0991b027d316a09a7e832f70368b6dfcc79ba` |
| `draft-polish.css` | `f698b7ad048c2f062c7080aef546f6dfa7f50bf0702f9a6ce3f67b786d27bb49` |
| `espn-2026-board-data.js` | `b57dd1d05e83aa94610a3aa281436f43000417ee761585652ba8a16a7f89a7db` |
| `fantasypros-2026-data.js` | `4dcf9eac910ab6af928004877d08f597068a889e3d05cacc2e12c2f8b4be0774` |
| `favicon.ico` | `03ff09fc401a3ce61252edd40e23b6305911234f1c70c3d8714bcfffd966bf2a` |
| `index.html` | `80a183f0aa9345b8fa13394d1318952804bbba6b9e3e626de14436f806a2c158` |
| `js/war-room-awareness-live-sync.js` | `7d3fb52673b6fde275d6d31b1908df4352aea0e24b5e8e90afe1c40d5cfb068d` |
| `js/war-room-command-bar-fixes.js` | `c78c187d86dcb74b9b2c12b462dcae98fde458e11c79c12feac09c3e6fbac7c4` |
| `js/war-room-command-bar.js` | `2fab18c3ce14f693e4c77c1e1b9d53fca498a83c30360e048abcbae33486bc27` |
| `js/war-room-draft-awareness.js` | `8091fc621fa31edaa3a871b2c56dc37be62d6ef5fae8b074027860614fc8c7e4` |
| `js/war-room-draft-state.js` | `397b323d5b3c0bc43b32534f357db7baddce3a233b8edb9c574b7674aa41c83e` |
| `js/war-room-espn-sync.js` | `82ee4915112287de0c838f40bf09f7afba1fc3cdcd25a8e0aa0d43c1d31fd53f` |
| `js/war-room-external-picks.js` | `a184288bdc201786fa05f0c1aa3c17ead883abbd8faba6a2a5b758331d5736ac` |
| `js/war-room-hardening.js` | `b85831a2680658bce616ee53e5e1c7b48e35c655b2201a843392a45ac5156666` |
| `js/war-room-layout-efficiency.js` | `575a325499c2efb71f6a2aa5a15bb991a3909ab35959a07787c3f39de0f350ac` |
| `js/war-room-phone-decision-view.js` | `278f840cc47fa83fab48336cb2d397d8707d1319e5c297c272d49393727443e9` |
| `js/war-room-rankings.js` | `b7db54cfae201b5cba26b1436381997fe72147e5c94af47e44aac12d6cb2baec` |
| `js/war-room-recommendations-canonical.js` | `17275497256c67b74259d2f3365e36a4ec0ec834604175c44e7d19e3d8abf03a` |
| `js/war-room-recommendations.js` | `0c430d7ffdb1417eaf7f0da8f699740ec39bf9fb300ff1394e74bb4bd9ac50f0` |
| `js/war-room-resilience.js` | `12b36645d1485b51fd9f73fea03b1ab86d7b0d6b570e274b66058902e51ef7f6` |
| `js/war-room-scoring-canonical.js` | `071508e9ac610dbe8c49755f2e6e9fa10a50ef088926ae6aa219752df953da9f` |
| `js/war-room-scoring.js` | `80363d640a4be2e5a3544c15f080a5bf8a146223d224c3ebea7b71c005c133b8` |
| `js/war-room-ui.js` | `cd6c77acdde14bd9fb144e5d16c0a2d05eca21113e17ba5892387c8944048a8a` |
| `layout-efficiency.css` | `f3fb62fbe96163962a53ed0fe6f45b2cdde18515b2dafb18ed692a5c7c0294bc` |
| `phone-decision-view.css` | `35cf477ab8aecb75cf6db5f9c5255a8029e5baf6e9b728521fb3ad7cede4cbb6` |
| `script.js` | `a1e020d0d1a0510ed5cddbae3aee1d6a76c42aa2721a77c5e6c1c20ee1a6d9e8` |
| `service-worker.js` | `589c9811cba20da1bc6070513f784b838ab2164a7129c313951910cb3476ad94` |
| `style.css` | `62dc910881b73861ab494902a7e61ddfb53e7012c9a9318ad990052f1e3748c5` |
| `war-room-config.js` | `da0cb729dc51472a7a814c2297ec8fce0967a90a7a4b85c14de95eb812e62410` |
