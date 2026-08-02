---
mode: code
topic: Poupa-me (codebase KB)
created: 2026-08-02
last_compiled_at: 2026-08-02T14:07:34Z
domain_model: docs/domain_model.puml (rendered: docs/domain_model.svg)
---

# Knowledge Base guide — Poupa-me (codebase KB)

Conventions for any LLM session working in this directory. Lighter variant of Andrej Karpathy's
["LLM Knowledge Bases"](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) note,
adapted for a personal, single-author code repo: there's no large external corpus to ingest, so
there's no `raw/` — the source material is your own notes plus the repo's git history, issues,
and pull requests.

## Layout

- `wiki/` — the compiled knowledge base: `.md` files with backlinks, organized by
  decision/subsystem. LLM-maintained; you mostly just read it (e.g. in Obsidian).
  - `wiki/Estrutura.md` — always-current overview (folder layout, tech stack, entry points,
    domain model if any). Fully regenerated on every `compile-wiki` run, unlike the rest of the
    wiki which only accumulates what's new.
  - `wiki/_geral/` — linked, read-only reference into the general vault at
    `C:\Users\diogo\OneDrive - 0cms6\CodeLab\my-vault\wiki`. Maintained by that vault's own
    compile step; never written to from this project.
- `notes/` — one file per scratch note, each with a `status: pending`/`status: compiled`
  frontmatter marker (see `notes/README.md`). Drop thoughts here as you work.

## Workflow

1. **Note** — whenever something worth remembering happens (a decision, a "why did I do it this
   way", a gotcha), drop a new file in `notes/` with `status: pending` frontmatter. Don't stop to
   organize it — that's `compile-wiki`'s job.
2. **Compile** — run `compile-wiki` periodically (or whenever you want the wiki caught up). It
   folds pending notes into the right wiki articles, walks commits, issues, and pull requests
   since `last_compiled_at` for anything note-worthy (issues/PRs need the `gh` CLI installed,
   authenticated, and a GitHub remote — otherwise it falls back to notes + git log only), and
   regenerates `wiki/Estrutura.md` from scratch (including the domain model described in
   `domain_model` above). Cross-links related articles and keeps `wiki/index.md` current. Re-run
   it any time — only the decision articles are incremental; the structure overview is always
   rebuilt fresh.

## Ground rules

- The wiki is written and maintained by the LLM. You view it, you don't hand-edit it.
- Keep `wiki/index.md` accurate — it's the entry point for every future session.
- A note is done once `compile-wiki` marks it `status: compiled` — leave the file in place as a
  record, don't delete it.
- `wiki/Estrutura.md` reflects the project *right now* — don't hand-edit it either, it gets
  overwritten on the next compile.
