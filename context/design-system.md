# Design system: "Signal Dark"

Tokens live in `src/index.css` (`:root`); all component styling is plain CSS in
`src/App.css`, organized by banner comments. No CSS-in-JS, Tailwind, or modules;
classes are global, kebab-case, and applied via `className`.

Principle (from the file header): flat black canvas, mono caps labels, **yellow
as the single focus color**. Derived from a design system called "Samis Deck".

## Tokens

| Group | Tokens |
| --- | --- |
| Surfaces | `--canvas #0a0a0a`, `--surface-1 #111`, `--surface-2 #1a1a1a` |
| Lines | `--line-subtle #2a2a2a`, `--line #6b6b6b`, `--baseline #707070` |
| Text | `--ink #f5f5f5`, `--ink-muted #a6a6a6`, `--ink-faint #858585` |
| Paper (cream callouts) | `--cream #ece8dc`, `--cream-ink #121212`, `--cream-muted #55524a` |
| Accents | `--yellow #ffd23f` (+ `--yellow-wash`), `--blue #4ea1ff`, `--red #ff5a5f` (+ washes at 15% alpha) |
| On accent | `--on-accent #0a0a0a` |
| Radius | `--radius-sm 6px`, `-md 12px`, `-lg 20px`, `-pill 999px` |
| Shadow | `--shadow-card`, `--shadow-glow-yellow` |
| Fonts | `--font-sans` Geist, `--font-mono` Geist Mono (Google Fonts) |

Always use the tokens rather than hex values. Focus ring: 2 px yellow outline on
buttons/links/inputs/selects (`:focus-visible`). Text selection is yellow on black.

## App.css sections (search for the banner)

Shell · Shared bits · Videos: stats bar (incl. Toggle switches) · Videos: layout ·
Videos: content (incl. study split + resizer) · Notes panel · Modal ·
Thoughts (blank page, incl. "paper cards") · Todos · Responsive (single 900 px breakpoint).

## Reusable class vocabulary

- Buttons: `btn-ghost` (default secondary), `btn-accent` (primary yellow), `btn-small`,
  `btn-watch` (+ `.watched`), `danger` modifier, `note-delete` (small ✕).
- Labels/badges: `chip`, `accent-chip`, `badge-count`, `kicker` (mono caps eyebrow).
- Forms: `select`, `search-input`, `toggle` (+ `toggle-ui`), `filter-chip` (+ `.active`).
- Layout: `view`, `view-head`, `view-title`, `empty-state`, `progress-track` / `progress-fill`
  (`.thin` variant), `modal-backdrop` / `modal`.
- Active/selected states use an `.active` or `.current` modifier class.

## Conventions when styling

- Add new styles under the matching section banner; keep the 900 px rules in the Responsive block.
- Icons are emoji or unicode glyphs (▶ ✔ ○ ✕ 📝 📚 ⏱), not an icon library.
- Accessibility patterns already used: `aria-label` on icon-only buttons, `aria-current`
  on active tab, `aria-pressed` on todo check, `role="separator"` + keyboard support on the resizer.
- Colors in `index.html`: `theme-color #0a0a0a` to match the canvas.
