<!-- server/src/seed/sampleTests/README.md -->

# TalentTrack Sample Tests (Built-in)

This folder contains built-in test templates in JSON format.

## Format (high level)
Each file follows the `TestTemplateSchema`:

- `metadata` (id, title, type, category, durationMinutes, difficulty, isPractice)
- `config` (optional: questionCount, negativeMarking, scorePerTestcase)
- `sections[]`
  - quiz section: `questions[]` with `options[]` and `correctAnswer`
  - coding section: `problems[]` with `languages` + `testcases[]`
    - Exactly **2 sample** testcases have `isSample: true`
    - Remaining are hidden (`isSample: false` or omitted)

## Planned Coverage (20–30 tests)
- Aptitude (5)
- Verbal (4)
- Logical/Reasoning (4)
- CS Core (4)
- DSA Quiz (3)
- Coding (Python/JS) (4)
- Mixed (Quiz + Coding) (2)

## Next step
Use the seed script (coming next) to import all JSON files into MongoDB:
- `npm run seed:tests`
