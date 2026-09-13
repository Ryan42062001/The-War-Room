# Work Helper / Super Troubleshooter Handoff

HANDOFF

Task ID: WR-056  
Role: Work Helper / Super Troubleshooter  
Status: REMEDIATION SURFACE EXPANSION REQUIRED  
Canonical implementation base: `791a5c817e8f11aaee24b66ac8b52f7681a8d136`  
Branch: `wr-056-runtime-path-remediation-impl`  
Historical diagnosis: PR #156 / `f1d4ece46dd89f4f1395d24b57af1b042757ecbd`

## Implementation

The approved trusted manifest-to-custody bridge is implemented within the exact Manager-authorized paths. It verifies immutable manifest identity, enforces strict source/rights/season allowlists, acquires immutable release assets, verifies downloaded bytes before provider handling, and reuses the accepted B2/R2 custody proof with narrowly parameterized identity inputs.

Detailed evidence: `.ai/work_helper/WR056_RUNTIME_PATH_IMPLEMENTATION.md`.

## Validation

- source-manifest regression suite: PASS three consecutive local runs;
- existing custody proof self-test: PASS;
- Python compilation: PASS;
- workflow YAML parsing: PASS;
- exact-head WR-046 preflight run `34736597963`: PASS;
- exact-head custody regression/governance job `103669034154`: PASS;
- exact-head full CI run `34736597965`: FAIL at the release workflow allowlist;
- controlled live jq fixture: intentionally not dispatched against a release-invalid head.

Safe fixture manifest:

- path: `.ai/work_helper/WR056_LIVE_FIXTURE_MANIFEST.json`
- SHA-256: `8e69050cefb9df413b589133aaadcd1a8f952e1fc0cf94502020dee8b69f8547`
- source: public non-sensitive jq release asset only.

## Preservation and boundaries

WR-046 workflow modified: **NO**  
WR-046 default proof identity/report semantics preserved: **YES**  
B2 COMPLIANCE / Legal Hold requirements preserved: **YES**  
R2 Indefinite Bucket Lock requirement preserved: **YES**  
WR039 / WR-D008 semantics changed: **NO**  
Returning-Player source admitted/downloaded/parsed: **NO**  
2026 outcomes inspected: **NO**  
Model/scoring/ranking/production work: **NO**  
Secrets accessed locally or committed: **NO**

## Additional exact expansion required

Authorize only `scripts/validate-release-candidate.mjs` so its exact permanent-workflow allowlist includes `.github/workflows/wr042-source-custody.yml`. Preserve its strict equality assertion and all other release checks.

Regression required: `npm run test:release` passes for exactly the three approved workflows and continues to reject an unapproved fourth workflow.

## Next gate

Manager approves the one-file expansion and returns WR-056 to Work Helper. Work Helper updates the strict allowlist, reruns full exact-head CI, and only then performs exactly one controlled live jq validation. After both pass, Manager creates and binds the fresh independent audit lane. Do not activate WR-042 or WR-043.
