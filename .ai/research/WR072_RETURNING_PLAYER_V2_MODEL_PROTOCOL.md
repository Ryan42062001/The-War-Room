# WR-072 — v2 Result-Gate Reproducibility Remediation

Status: `REMEDIATED PRE-SCORE — MANAGER FREEZE / WR-076 AUDIT REQUIRED`

Historical WR-073-audited head `d75e58052dd555cd5b3f952fc2b3556287d75f9a`, protocol `returning-player-v2-model-protocol/1.0.0-wr072`, and lock `d2fb326875c954446b23e2761df0feaad4b814aa49dd0465277979a3c9d9bd73` remain immutable failed-audit evidence. Sole finding: `WR-073-AUD-01`.

New protocol: `returning-player-v2-model-protocol/1.1.0-wr072`  
New gate contract: `returning-player-v2-result-gates/1.1.0-wr072`  
Machine lock: `831aed6e8cad2d760a58a3c9f5bc298891e0ed11707ecc545c9254b29110c61d`

## Inheritance and unchanged authority
The 1.1 lock incorporates the exact 1.0 lock by SHA-256 for all semantics except protocol/gate identity, status/audit route, gate mathematics, and confirmation bootstrap. Thus the positively audited upstream bindings, 28 stats-only feature schema, preprocessing/serializer/target/candidate identities, target/chronology/splits, baselines, evidence/outcome isolation, fail-closed rules, environment and publication contract are unchanged. Snapshot/cohort remain `1.2.0-wr059`; WR-042/WR-069 hashes remain unchanged. Metadata/draft predictor counts remain zero.

## Exact gate math
Gate rows require `OBSERVED` target plus finite target/candidate/primary values; secondary gates also require both finite secondary baselines. Missing/nonfinite required values fail closed. Use finite binary64 CPython 3.12.7, `math.fsum`, `math.sqrt`, no decision rounding. `MAE=fsum(abs(pred-target))/n`; `RMSE=sqrt(fsum((pred-target)^2)/n)`. Improvement=`(B-C)/B`; regression=`(C-B)/B`; positive means better/worse respectively. B=0,C=0=>0; B=0,C>0=>fail closed; B<0 fatal.

Pooled, position (QB/RB/WR/TE, relative gate only n>=30), and declared-season groups are frozen in the machine lock, including zero-support failures. Exact definitions are bound for MAE lift/RMSE regression, position and season regressions, unweighted mean-season delta, non-worse-position count, minimum position support, and each-secondary comparison on one identical finite pooled universe. Every secondary must pass.

Ordering cell = target-season × position; n<8 is preregistered exclusion. Spearman uses ascending average ranks with exact binary64 ties and explicit Pearson-on-ranks math. Rank MAE sorts prediction/target descending with ties by namespace UTF-8 then player-id UTF-8. Cell metrics are weighted by evaluable n in season-ascending then QB,RB,WR,TE order. `>=`/`<=` are inclusive; equality passes; undefined/nonfinite fails.

## Exact confirmation bootstrap
Confirmation 2022–2025 only, after complete finite candidate+primary predictions, zero fallbacks and zero lineage/schema/digest failures. Row universe is pooled confirmation MAE. Cluster `(player_id_namespace,player_id)`; clusters sort by UTF-8 bytes of compact JSON `[namespace,id]`; rows retain stable-key order; K>=2. RNG is exactly NumPy 2.1.3 `Generator(PCG64(72073))`, constructed once, never reseeded. For r=0..4999 call exactly `rng.integers(0,K,size=K,dtype=numpy.int64,endpoint=False)`. `bincount(...,minlength=K)` yields multiplicity; cluster drawn m times weights every row m. Replicate statistic = weighted candidate MAE − weighted primary MAE using `math.fsum` in frozen order; negative favors candidate.

CI is exactly `numpy.quantile(float64_replicates,[0.025,0.975],method='linear')`; equivalent h=(R−1)q, j=floor(h), k=ceil(h), g=h−j, Q=(1−g)x[j]+gx[k]. Gate Q(.975)<=0 inclusive/unrounded. K<2, zero weighted rows, nonfinite input/replicate or NaN quantile fail; identical finite replicates allowed. Evidence serializes cluster universe, all 5,000 `.17g` deltas (`-0`=>`0`), final RNG state, and endpoints with deterministic JSON/LF hashes. Synthetic conformance: replicate SHA `6e3fa80c05f2c51d5369c9222c57cd5decbe31affb37e7d6e6b7a6d7c644c0c4`, Q.025=`-1.25`, Q.975=`0.5`, gate=false.

No fitting, scoring, tuning, result comparison, prediction, outcome inspection/join, source reacquisition/refresh/substitution, failed metadata/draft use, provider mutation, production/ranking, composition or Phase-6 work occurred. Manager freezes exact new PR #207 head/hash/scope/CI before WR-076. R&D does not merge or activate WR-076.
