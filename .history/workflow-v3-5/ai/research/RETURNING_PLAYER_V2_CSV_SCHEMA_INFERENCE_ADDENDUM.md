# Returning-Player v2 Deterministic CSV Schema-Inference Contract Addendum

Contract clarification ID: `wr-returning-player-v2-csv-schema-inference-addendum`  
Contract clarification version: `1.0.0`  
Task: `WR-067`  
Status: `FROZEN_NO_SCORING — PENDING WR-068 INDEPENDENT AUDIT`  
Predecessor contract: `wr-returning-player-v2-evidence-contract/1.0.0`  
Predecessor accepted machine-lock SHA-256: `3fac50f89afa1bb69d356c67f458f882f167ea595661d8eb4772b1a66cdb677a`

## 1. Purpose and authority

This addendum resolves one semantic gap only: how a raw **CSV** source instance governed by the accepted Returning-Player v2 evidence contract derives the ordered raw schema required by WR-039 as `(column,type,nullable)` tuples and the corresponding canonical schema SHA-256.

It does **not** amend WR-039 v1.0.0 in place. The predecessor remains accepted exactly as audited. This is a separately versioned clarification bound to the predecessor ID/version/hash above. If this addendum conflicts with WR-039 outside the narrow raw-CSV typed-schema derivation surface, WR-039 controls and the conflict fails closed.

This addendum is normative project policy. No external CSV parser, dataframe dtype engine, language runtime, RFC, provider-specific convention, or library inference heuristic is normative. Implementations may use any tooling only if they reproduce these semantics exactly and pass the synthetic conformance corpus.

Synthetic conformance corpus:

`.ai/research/generated/RETURNING_PLAYER_V2_CSV_SCHEMA_INFERENCE_CONFORMANCE.json`

Corpus SHA-256: `1f70d5e31ed5a62e00e5b02e06f6271e9c30b36951389d9607c50fdf5f71ffe1`  
Conformance cases: **49** (33 PASS, 16 FATAL)

## 2. Exact semantic delta

WR-039 already requires, for each exact source instance, raw schema as ordered `(column,type,nullable)` tuples, a schema SHA-256, and a physical row count. It did not define executable CSV type/nullability inference.

This addendum newly freezes only:

1. raw CSV byte decoding and grammar;
2. null/empty-field semantics;
3. the closed raw type vocabulary;
4. lexical classification and mixed-type promotion;
5. observed nullable semantics;
6. physical row-count and complete-file-scan rules;
7. fatal CSV/schema conditions;
8. canonical typed-schema serialization and SHA-256;
9. implementation portability requirements; and
10. a source-independent synthetic conformance corpus.

No source class, source field, cutoff rule, rights/retention rule, custody identity, cohort key, feature/model rule, target/outcome rule, or production/ranking authority is added or changed.

## 3. Normative raw CSV byte decoding and grammar

### 3.1 Encoding and BOM

The input to schema derivation is the exact retained source byte sequence.

Processing order is normative:

1. If the file begins with exactly `EF BB BF`, strip exactly that one leading UTF-8 BOM.
2. Otherwise, if the file begins with a UTF-16 or UTF-32 BOM (`FF FE`, `FE FF`, `00 00 FE FF`, or `FF FE 00 00`), fail `CSV_UNSUPPORTED_BOM`.
3. Decode all remaining bytes as strict UTF-8. Any invalid byte sequence fails `CSV_INVALID_UTF8`.
4. A later U+FEFF character is ordinary field/header data. No Unicode normalization is performed.

### 3.2 CSV tokens

The delimiter is exactly comma U+002C `,`.

The quote character is exactly double quote U+0022 `"`.

There is no backslash escape. Backslash U+005C is ordinary data.

A quoted field begins only when `"` is the first character of a field. Inside a quoted field, two consecutive quotes `""` encode one literal quote. A single quote closes the field. After a closing quote, only a comma, an accepted record terminator, or end-of-file is legal. Any other character, including whitespace, fails `CSV_MALFORMED_QUOTING`.

An unquoted field may contain any decoded Unicode scalar value except comma, CR, LF, or quote. A quote appearing after any unquoted field content fails `CSV_MALFORMED_QUOTING`.

### 3.3 Record terminators and embedded newlines

Outside quoted fields, the only accepted record terminators are:

- LF (`0A`); or
- CRLF (`0D 0A`).

A lone CR outside a quoted field fails `CSV_INVALID_LINE_ENDING`.

Inside a quoted field, CR, LF, and CRLF are ordinary preserved field data and do not terminate a record.

LF and CRLF record terminators may coexist in one file. Parsing does not normalize field content. Record terminators are structural and are not part of field text.

A terminal record terminator ends the preceding record and does **not** create an additional empty record. A blank line between records is a physical record containing one unquoted empty field.

### 3.4 EOF behavior

EOF after an unquoted field closes that field and record.

EOF immediately after a closing quote closes that quoted field and record.

EOF immediately after a delimiter emits a final unquoted empty field and closes the record.

EOF while inside an open quoted field fails `CSV_MALFORMED_QUOTING`.

A zero-byte file, or a file containing only a stripped UTF-8 BOM, fails `CSV_MISSING_HEADER`.

### 3.5 Header rules

The first parsed record is the header. It is never counted as a physical data row.

Header text is the exact decoded/unescaped field text. Quotedness does not become part of the header name.

- An exact empty header name (`""` after CSV parsing) fails `CSV_BLANK_HEADER`.
- Whitespace-only header names are not blank because whitespace is never trimmed.
- Duplicate header names are detected by exact Unicode scalar-value equality after CSV unescaping.
- No case folding or Unicode normalization occurs. For example, precomposed `é` and decomposed `e` + combining acute are distinct names.
- Duplicate headers fail `CSV_DUPLICATE_HEADER`.

### 3.6 Data row width

Every data record must contain exactly the same number of fields as the header.

Any narrower or wider data row fails `CSV_ROW_WIDTH_MISMATCH`.

No partial schema, row count, or admission result may be emitted after any fatal parse/schema condition.

### 3.7 Whitespace

No leading, trailing, or internal whitespace is removed or normalized from headers or fields.

Whitespace participates in lexical type classification. Thus `1` can be numeric while ` 1` and `1 ` are UTF-8 strings.

## 4. Null and empty-field semantics

The null-token set contains exactly one syntactic form:

**an unquoted field with zero decoded characters.**

No textual token is a null token.

Therefore:

- unquoted empty field -> null;
- quoted empty field `""` -> non-null empty UTF-8 string;
- `NA`, `NaN`, `null`, `NULL`, `None`, `none`, `N/A`, and similar literals -> non-null text unless another lexical rule below classifies them;
- whitespace-only fields -> non-null UTF-8 strings;
- quoted non-empty values use the same non-null lexical type rules as unquoted non-empty values.

Null matching is therefore not case-sensitive because there are no textual null tokens.

## 5. Closed canonical raw type vocabulary

The only allowed raw type labels are:

1. `boolean`
2. `int64`
3. `decimal`
4. `utf8`

No `date`, `datetime`, `timestamp`, categorical, unsigned integer, binary float, or provider-specific type is inferred by this addendum.

### 5.1 Boolean

A non-null field is `boolean` only when its exact text is:

- `true`
- `false`

Matching is case-sensitive. `TRUE`, `False`, `0`, and `1` are not booleans.

### 5.2 int64

The integer lexical grammar is exactly:

`^-?(?:0|[1-9][0-9]*)$`

The mathematical integer value must be within:

`-9223372036854775808` through `9223372036854775807`, inclusive.

If the token matches the integer grammar and is in range, its observed type is `int64`.

`-0` is valid `int64`.

A leading plus sign is not accepted. Leading zeros are not accepted except the single token `0`; therefore `00`, `001`, `-00`, and `+1` are `utf8`.

### 5.3 decimal

The finite decimal lexical grammar is exactly:

`^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$`

A token is observed as `decimal` when either:

1. it matches the integer grammar but its mathematical value is outside signed int64 range; or
2. it matches the decimal grammar and contains a decimal point `.` or exponent marker `e`/`E`.

No binary floating conversion is part of type inference. Decimal classification is lexical except for the signed-int64 range check above. Decimal magnitude and exponent length are not otherwise bounded by this contract.

Examples:

- `1.0`, `-0.0`, `1e3`, `1e+3`, `-2E-4` -> `decimal`
- `.5`, `1.`, `01.2`, `+1.0`, `1.2.3` -> `utf8`
- integer-shaped `9223372036854775808` -> `decimal`

### 5.4 Non-finite values

`NaN`, `nan`, `Infinity`, `-Infinity`, `inf`, `-inf`, and any other non-finite spelling are not numeric under the grammar and are `utf8`.

No non-finite numeric value is admitted by raw schema inference.

### 5.5 Date and datetime behavior

Raw CSV schema inference performs **no date or datetime inference**.

All date-like/datetime-like tokens are `utf8` unless they independently satisfy another exact lexical rule above (for example, a bare four-digit year can be `int64`; a hyphenated date remains `utf8`).

### 5.6 UTF-8 fallback and identifiers

Every non-null field not classified as `boolean`, `int64`, or `decimal` is `utf8`.

The deliberate no-leading-zero numeric grammar protects identifier-like values such as `00123` by classifying them as `utf8`.

Quotedness does not force a non-empty value to `utf8`; for example `"1"` is `int64`. Quoted empty is the special non-null empty `utf8` value defined in Section 4.

## 6. Mixed-type inference and promotion

Type inference scans every physical data record. Nulls do not contribute a non-null type, but they set the column's nullable flag.

For non-null observations, promotion is deterministic, associative for the allowed set, and source-independent:

| Current / observed combination | Result |
|---|---|
| same type + same type | same type |
| `int64` + `decimal` | `decimal` |
| any type + `utf8` | `utf8` |
| `boolean` + `int64` | `utf8` |
| `boolean` + `decimal` | `utf8` |

The table is symmetric.

Consequences:

- integer + decimal -> decimal;
- numeric + string -> utf8;
- boolean + numeric -> utf8;
- date-like text + any numeric -> utf8;
- int64 + integer-shaped overflow -> decimal;
- malformed numeric token + numeric -> utf8;
- null + T -> T while nullable becomes true.

There are no source-specific, column-name-specific, season-specific, provider-specific, or sampled-data exceptions.

## 7. Nullable semantics

For each column, `nullable` is an observed whole-file boolean:

`true` if and only if at least one physical data row contains the exact null syntactic form for that column.

Otherwise it is `false`.

Quoted empty strings do not set nullable.

For a header-only file with zero data rows, every column is typed `utf8` with `nullable=false`.

For a column whose every observed data value is null, the type is `utf8` with `nullable=true`.

Nullability is not inferred from the logical type, provider schema, dataframe defaults, or missing-value conventions.

## 8. Physical schema derivation and row count

Schema derivation requires a complete scan from the first byte through EOF. Sampling, chunk-limited dtype guessing, early-stopping type inference, or library-default sampling is forbidden.

`physical_row_count` is the number of syntactically valid data records after the header, before any source-class filtering or approved-column projection.

Embedded CR/LF inside quoted fields does not increment the physical row count.

Rows containing only null fields still count as physical rows when their width matches the header.

A fatal condition anywhere in the file invalidates the entire derivation. No partial row count or partial typed schema is contract-admissible.

Ordered schema column order is exactly header order.

## 9. Fatal conditions and deterministic precedence

The contract defines these fatal codes:

- `CSV_UNSUPPORTED_BOM`
- `CSV_INVALID_UTF8`
- `CSV_MALFORMED_QUOTING`
- `CSV_INVALID_LINE_ENDING`
- `CSV_MISSING_HEADER`
- `CSV_BLANK_HEADER`
- `CSV_DUPLICATE_HEADER`
- `CSV_ROW_WIDTH_MISMATCH`

Evaluation order is:

1. BOM handling;
2. strict UTF-8 decoding;
3. left-to-right CSV tokenization/record parsing, stopping at the first encountered syntax/line-ending error;
4. header existence;
5. blank-header check;
6. duplicate-header check;
7. complete data-row width validation while scanning;
8. type/nullability inference and canonical schema construction.

Any fatal result means no `ordered_schema`, `schema_sha256`, or admissible `physical_row_count` exists for that source instance.

## 10. Canonical ordered typed-schema encoding and hash

### 10.1 Tuple shape

The ordered schema is an array of column tuples, one per header column, preserving header order:

`[column_name, type_label, nullable_boolean]`

Example:

`["player_id","utf8",false]`

### 10.2 Version-bound outer object

The exact canonical schema byte sequence is UTF-8 encoding of this JSON object shape with fields in this exact order:

`{"schema_contract_id":"wr-returning-player-v2-csv-schema-inference-addendum","schema_contract_version":"1.0.0","columns":[...ordered tuples...]}`

There is:

- no BOM;
- no insignificant whitespace;
- no final newline.

### 10.3 Canonical JSON string escaping

Every JSON string is encoded as follows:

1. surround with U+0022 double quotes;
2. U+0022 -> `\"`;
3. U+005C -> `\\`;
4. U+0000 through U+001F -> `\u00xx` using exactly four lowercase hexadecimal digits;
5. every other Unicode scalar value is emitted literally as UTF-8;
6. solidus `/` is never escaped;
7. no Unicode normalization is applied.

JSON booleans are exactly lowercase `true` and `false`.

No alternative JSON serializer output is authoritative unless its exact bytes match this procedure.

### 10.4 Schema digest

`schema_sha256` is lowercase hexadecimal SHA-256 of the exact canonical schema bytes above.

The digest is intrinsically version-bound because both `schema_contract_id` and `schema_contract_version` are inside the hashed bytes.

Changing any header name/order, type, nullable flag, contract ID, or contract version changes the canonical bytes and therefore the digest.

## 11. Implementation authority and portability

The normative authority is the lexical/state-machine behavior in this addendum plus the machine lock and conformance corpus.

No parser/library/runtime version is authoritative.

A later implementation may use a standard CSV library only if a wrapper makes all behavior identical, including:

- quoted-versus-unquoted empty distinction;
- strict line-ending behavior;
- exact header preservation;
- exact malformed-quote failures;
- complete-file scanning;
- the project lexical type classifier and promotion rules;
- the project canonical schema serializer.

Library dtype inference, automatic NA token recognition, whitespace trimming, Unicode normalization, date parsing, sampled type inference, float coercion, or provider-specific schema hints must be disabled or bypassed.

Any implementation or library upgrade that changes a conformance result fails closed and requires remediation before use.

## 12. Synthetic conformance corpus

The conformance corpus contains exact synthetic input bytes encoded as Base64. Every case also binds an input byte size and SHA-256.

For every PASS case, the corpus freezes:

- exact physical row count;
- exact ordered `[column,type,nullable]` tuples;
- exact `schema_sha256`.

For every FATAL case, the corpus freezes the exact fatal code and explicitly has no schema or schema digest.

The corpus covers:

- UTF-8 and BOM handling;
- invalid UTF-8 and unsupported BOMs;
- LF/CRLF/mixed endings and lone CR behavior;
- quoting, doubled quotes, embedded LF/CR, backslash non-escaping, commas in quotes;
- whitespace preservation;
- missing/blank/duplicate headers and no Unicode normalization;
- row-width mismatch;
- unquoted null versus quoted empty;
- literal NA/NaN/null/None tokens;
- booleans and case sensitivity;
- signed int64 boundaries and overflow;
- decimal/exponent grammar and signed zero;
- leading zeros, plus signs, malformed numerics, and non-finite tokens;
- numeric/boolean/string mixed promotion;
- date/datetime non-inference;
- header-only/all-null files;
- physical row counting;
- canonical control-character and quote escaping.

WR-068 must independently reproduce every expected PASS schema/hash and every expected FATAL code without touching retained provider bytes.

## 13. Unchanged WR-039 / WR-D008 semantics

The following remain unchanged:

- predecessor contract `wr-returning-player-v2-evidence-contract/1.0.0` and accepted machine lock;
- all source classes and approved-column governance;
- exact-byte source identity and content-addressed custody;
- source rights, retention, cutoff, fallback, and fail-closed requirements;
- source-instance statuses and source-snapshot chronology;
- stable cohort key and full-row evidence requirements;
- feature/preprocessing/model/prediction evidence requirements;
- outcome separation and no-target-before-lock chronology;
- WR-021/WR-023 frozen sentinels;
- WR-D001 production ranking authority;
- WR-057 exclusion of `draft_picks.csv` unless separately re-versioned/governed in the future.

This addendum does not retroactively change any historical source snapshot or certify any previously incomplete source instance.

## 14. Authorization boundary

This contract package accesses **no retained/provider raw source bytes** and authorizes **no retained-byte parsing by itself**.

It does not authorize:

- B2/R2 retrieval;
- upstream reacquisition or refresh;
- provider mutation or custody workflow changes;
- `draft_picks.csv` acquisition/parsing/use;
- 2026 regular-season outcome access;
- target/outcome joins;
- model fitting, scoring, tuning, comparison, evaluation, or predictions;
- ranking/production changes;
- Phase-6 work.

A WR-068 PASS-family verdict authorizes only Manager acceptance of this exact clarification and creation of a fresh successor safe-consumer parser implementation task. That later implementation must still be independently audited and integrated under the Manager's required gates before WR-059 can resume.
