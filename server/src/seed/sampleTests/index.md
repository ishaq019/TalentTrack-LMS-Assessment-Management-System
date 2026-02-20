<!-- server/src/seed/sampleTests/index.md -->

# TalentTrack Sample Tests Catalog (Bundles)

All sample tests are stored as `*.bundle.json`.  
The seeder `npm run seed:tests` automatically loads **all** bundles in this folder.

---

## Aptitude (5 tests)
File: `aptitude.bundle.json`
- T-APT-001 — Aptitude Basics 01 (easy)
- T-APT-002 — Aptitude Basics 02 (easy)
- T-APT-003 — Time, Speed & Work 01 (medium)
- T-APT-004 — Profit & Loss + SI/CI 01 (medium)
- T-APT-005 — Aptitude Mixed Drill 01 (practice, medium)

## Verbal (5 tests)
File: `verbal.bundle.json`
- T-VRB-001 — Verbal Basics 01 (practice, easy)
- T-VRB-002 — Verbal Basics 02 (easy)
- T-VRB-003 — Sentence Correction 01 (medium)
- T-VRB-004 — Reading Comprehension 01 (practice, medium)
- T-VRB-005 — Verbal Mixed Drill 01 (medium)

## Logical / Reasoning (5 tests)
File: `logical.bundle.json`
- T-LOG-001 — Logical Reasoning Basics 01 (practice, easy)
- T-LOG-002 — Blood Relation & Direction 01 (easy)
- T-LOG-003 — Seating & Arrangement 01 (medium)
- T-LOG-004 — Syllogisms & Statements 01 (practice, medium)
- T-LOG-005 — Logical Mixed Drill 01 (medium)

## CS Core (4 tests)
File: `cs-core.bundle.json`
- T-CS-OS-001 — OS Fundamentals 01 (practice, easy)
- T-CS-DBMS-001 — DBMS Fundamentals 01 (practice, easy)
- T-CS-CN-001 — Computer Networks 01 (practice, easy)
- T-CS-OOP-001 — OOP Fundamentals 01 (practice, easy)

## DSA (3 tests)
File: `dsa.bundle.json`
- T-DSA-001 — Arrays & Strings (practice, easy)
- T-DSA-002 — Linked List, Stack, Queue (easy)
- T-DSA-003 — Trees, Graphs, Complexity (practice, medium)

## Coding (4 tests)
File: `coding.bundle.json`
- T-CODE-001 — Sum of Two Numbers (practice, easy)
- T-CODE-002 — Reverse String (easy)
- T-CODE-003 — Valid Parentheses (practice, medium)
- T-CODE-004 — Two Sum Indexes (medium)

## Mixed (2 tests)
File: `mixed.bundle.json`
- T-MIX-001 — CS Core + Coding (medium)
- T-MIX-002 — Aptitude + DSA Coding (practice, medium)

---

## Total tests: 28 ✅
Requirement target: 20–30 ✅

---

## Next steps
1) Seed admins: `npm run seed:admins`
2) Seed tests: `npm run seed:tests`
3) Start server: `npm run dev`
