# Infographic Library

This folder is the source-of-truth inventory for infographic section components.
Each entry maps one or more key concepts to one reusable HTML section fragment.

## Why this exists

- Keep infographic design reusable and intentional.
- Avoid duplicate visuals for the same concept.
- Ensure important concepts eventually have explicit visual treatment.

## Data file

- `sections.json` is the canonical registry.
- Entries are keyed by `id`.
- A section maps to a source section from one infographic page, and is materialized into `fragments/`.

## Creating new infographics

Use this order when introducing a new infographic page under `web/resources/`:

1. Build the full source page first (same structure as existing infographics).
2. Keep one top-level `<section>` per reusable block inside `<main>`.
3. Add section metadata to `sections.json`.
4. Validate selectors before marker conversion:

```sh
python3 tools/sync_infographic_sections.py --check --no-fragment-fallback --manifest web/resources/infographic-library/sections.json
```

5. Replace sections in source HTML with marker lines:

```html
{{infographic-section "i4-section-01-bootstrapping"}}
```
or with explicit numbering:

```html
{{infographic-section "i4-section-01-bootstrapping" number=1}}
```

6. Run:

```sh
make sync-infographic-sections
```

7. Build and verify render output:

```sh
make build-web DRAFT=architects_v4_wrapped
rg "\\{\\{infographic-section\\s+\"...\"\\}\\}" build/web/infographic*.html
```

For a longer implementation walkthrough, use:

`skills/markdown-driven-infographic-fragments.md`

## Required fields

Each section entry has:

- `id`: stable unique identifier.
- `title`: human-readable label.
- `infographic`: source HTML under `web/resources/` (e.g., `infographic-2.html`).
- `source_selector`: CSS selector for the source section inside the source infographic.
- `concepts`: concept names from `drafts/architects_v4_wrapped/meta/key_concepts.md`.
- `status`: one of `draft`, `published`, `deferred`.

Optional fields:

- `notes`: context for future maintainers.
- `chapter_refs`: draft chapter filenames that discuss the same idea.
- `fragment`: generated file name (set automatically by sync tooling).
- `dependencies`: optional concept or section dependencies.

## Coverage workflow

- Add a new section entry when you add or expand a visual concept.
- Keep the `concepts` list conservative: one concept can appear in multiple sections.
- Run:

```sh
make check-infographic-coverage
make sync-infographic-sections
```

This reports:

- Which canonical concepts are covered.
- Which concepts are currently uncovered.
- Any concept tags that are not recognized in `key_concepts.md`.

Use `--strict` in `tools/check_infographic_coverage.py` for CI-style enforcement.

### Sync workflow

- After editing selectors, concept mappings, or fragment files, run:

```sh
python3 tools/sync_infographic_sections.py --check
python3 tools/sync_infographic_sections.py --no-fragment-fallback  # fail if selectors are missing
python3 tools/sync_infographic_sections.py
```

- The sync command writes `web/resources/infographic-library/fragments/<id>.html`.
- It also writes `web/resources/infographic-library/index.json` for quick lookup.

### Markdown helper

Use this helper in markdown (and infographic source HTML) to inline a section fragment:

```md
{{infographic-section "i3-section-03-deterministic-sandwich"}}
```
`number` is optional. If you want a sequence rendered, pass `number=<N>` (or `index=<N>`); otherwise the section is unnumbered.

The website build step resolves this marker and injects the matching fragment HTML
into rendered pages, including the source infographic HTML files (`infographic*.html`).
When any page contains an infographic marker, the build also injects the shared runtime bootstrap
(tailwind/font stack, chart.js, plotly, `infographic-deck-runtime.css`, and
`infographic-deck-runtime.js`) so section interactivity is preserved without page-local wiring.

A working example slide deck page lives at:

- `web/resources/infographic-deck.html`

When testing manually, always open:

- `build/web/infographic-deck.html`

`web/resources/infographic-deck.html` is the source template used during build.

## Slide decks for presentations

Use `{{infographic-deck ...}}` to compose interactive deck-style presentations from
reusable sections. The deck renders one slide at a time with:

- Previous/next controls
- Dot navigation
- Arrow-key and page-key controls when focused
- Current slide index

Example:

```md
{{infographic-deck "i2-section-03-drift-vs-convergence" "i2-section-04-moat-also-loop" "i2-section-05-loop-is-the-moat"}}
```

Each section id can be quoted or provided as plain tokens:

```md
{{infographic-deck i2-section-03-drift-vs-convergence i2-section-04-moat-also-loop i2-section-05-loop-is-the-moat}}
```

You can place deck markers in:

- Markdown chapter content
- Infographic source HTML
- Dedicated talk pages under `web/resources/` (copied verbatim, then resolved by build)

### Presentations-ready page pattern

Create a simple page in `web/resources/`:

```html
<!doctype html>
<html>
  ...
  <main id="main">
    <h1>Session Deck</h1>
    {{infographic-deck "i2-section-03-drift-vs-convergence" "i2-section-05-loop-is-the-moat"}}
  </main>
  ...
</html>
```

The marker is expanded at build time the same way as chapter markdown.

Build script location:

- `tools/build_site.py::_replace_infographic_includes`
