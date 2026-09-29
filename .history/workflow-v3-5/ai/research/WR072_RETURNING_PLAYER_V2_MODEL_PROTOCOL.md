# WR-072 — Returning-Player v2 Model Protocol — 1.2 Remediation

Status: FROZEN PRE-SCORE REMEDIATION — MANAGER FREEZE / WR-077 AUDIT REQUIRED

Historical failed targets remain immutable:
- 1.0.0 at d75e58052dd555cd5b3f952fc2b3556287d75f9a
- 1.1.0 at 95b1fdfb36ffc7b865597bf7131fa1dd9f45ae73

WR-076 returned FAIL — REMEDIATION REQUIRED with WR-076-AUD-01 (HIGH) and WR-076-AUD-02 (MEDIUM). This version changes only those two surfaces before any model/result work.

New identities:
- protocol `returning-player-v2-model-protocol/1.2.0-wr072`
- gates `returning-player-v2-result-gates/1.2.0-wr072`
- fixture `returning-player-v2-bootstrap-conformance-fixture/1.0.0-wr072`
- machine-lock SHA-256 `aed044e6b7df9684153181a7a97a47a86c50ce9049db063ecdd8a973b1a832b6`

The exact 1.1 lock remains normative for every unchanged semantic via SHA-256 `831aed6e8cad2d760a58a3c9f5bc298891e0ed11707ecc545c9254b29110c61d`.

## WR-076-AUD-01
Normative signatures:
`relative_improvement(candidate,baseline)=(baseline-candidate)/baseline`
`relative_regression(candidate,baseline)=(candidate-baseline)/baseline`

The named baseline operand is always the denominator. Zero/nonfinite rules are machine-frozen. Every relative gate now machine-binds named candidate and baseline operands for MAE lift, RMSE regression, position MAE regression, max-season MAE regression, weighted rank-MAE regression, and each named secondary-baseline comparison. No B/C aliases or positional interpretation remain. Thresholds are unchanged.

## WR-076-AUD-02
The complete synthetic fixture is embedded in the machine lock.

Fixture SHA-256: `3fb3c2088e17f42ad588a94f018abbcbd42cefeb46422a0bcb1da50b31cba3f7`

Fixture core is exact sorted-key compact UTF-8 JSON + LF containing schema, exact row order, and 8 rows across four synthetic player clusters with candidate and primary-baseline absolute errors.

Expected under inherited NumPy 2.1.3 PCG64(72073) bootstrap mechanics:
- cluster SHA `aa63baf5f7658212ec4f13bcefbd3c0087c6186d0afcfba7aec6d84ffc86a321`
- replicate count 5000
- replicate SHA `b4edb70c67e8c678e00465e50e017b6401ecfff0d60ed3c608fda1c651e9de6d`
- Q.025 `-0.625`
- Q.975 `1`
- final RNG-state SHA `b235708c403dd720543444365e54f2440817a03c09ceadfbe6c46106b22a3188`
- gate `Q(.975)<=0.0` = `false`

Preserved by exact predecessor lock: accepted source/cohort/custody authority, 5,176 keys, 28 stats-only predictors, zero metadata/draft predictors, target, chronology, preprocessing, candidate, thresholds, aggregation/order mechanics, full-row evidence, outcome isolation, fail-closed rules, environment.

No fitting, scoring, tuning, prediction, result inspection/comparison, target/outcome join, 2026 outcome use, source reacquisition/substitution, provider mutation, production/ranking change, season-total composition, or Phase-6 work occurred.

Next: Manager freezes exact PR #207 head/hash/scope/CI, then may activate WR-077.
