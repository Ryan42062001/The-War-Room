# WR-035 Integrity Statement

- 2026 regular-season outcomes inspected: **NO**
- Maximum outcome season loaded: **2025**
- WR-021 snapshot changed: **NO**
- WR-023 protocol/manifest changed: **NO**
- WR-033 model/features/preprocessing changed: **NO**
- WR-034 model/features/selection changed: **NO**
- Production code or rankings changed: **NO**
- Phase-6 replacement/FLEX/MSV work performed: **NO**
- Scored historical rows: **3,508**
- Deterministic substantive-output rerun: **PASS; byte-for-byte equal**

The WR-033 replay exactly matched committed aggregate metrics at tolerance `1e-10`. The WR-034 replay matched every committed row at the same tolerance. Frozen WR-021/WR-023 hashes matched before and after execution.

