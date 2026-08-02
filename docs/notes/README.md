# notes/

Scratch notes — one file per note, not one growing file. Drop a thought here whenever you want
to capture it (a decision, a "why did I do it this way", a gotcha you just hit) without stopping
to organize it. `compile-wiki` reads this folder and folds pending notes into `../wiki/`.

Each note starts with a small frontmatter block marking whether it's been compiled yet:

```markdown
---
status: pending
---

Whatever you want to write, unstructured.
```

After `compile-wiki` processes a note, it rewrites the frontmatter to:

```markdown
---
status: compiled
compiled: 2026-08-02
articles:
  - Some Article Name
---
```

Anything without `status: compiled` (including notes with no frontmatter at all) is treated as
pending. This keeps any single file small and means `compile-wiki` only ever has to read what's
actually new.
