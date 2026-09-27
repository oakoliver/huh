# Changelog

## 1.1.0 — parity with huh v2.0.3 + main @ ffb6a97

Upstream target: [charmbracelet/huh v2.0.3](https://github.com/charmbracelet/huh/releases/tag/v2.0.3) plus `main` at [`ffb6a97`](https://github.com/charmbracelet/huh/commit/ffb6a97).

1.0.x already tracked the huh v2 API (`Theme.theme(isDark)`, `ThemeFunc`, `KeyPressMsg`, `PasteMsg`) and the v2.0.1–v2.0.3 fixes: `ensureCursorVisible` for multi-line options (#749), `withWidth` recomputing the viewport (#747), no double paste (#746), and key-press-only handling. This release adds the two behavioral fixes merged to `main` after v2.0.3. The other `main` commits are dependency bumps, CI, docs and lint changes.

### Fixed

- **Select: matches hidden above the cursor when filtering** (upstream #804). Filtering used to keep the old cursor, clamped to the match count, and the viewport stayed where it was. Filtering from the bottom of a long list therefore hid earlier matches above the window. When the filter text changes, the cursor now moves to the first match and the viewport scrolls back to the top. Moving through an unchanged filter keeps the cursor where it is.
- **Groups with no fields** (upstream #808). Such groups used to throw. An empty group now renders nothing and is treated as hidden, so the form moves on to the next group. Next and previous field go straight to the next and previous group. A form with no groups is completed on `init()`, ignores updates, renders `""`, and `run()` sets `State` to `Completed`. `Form.getFocusedField()` returns `null` when nothing is focused, so its return type is now `Field | null`. `Form.keyBinds()` and `Form.errors()` return `[]`. `Selector.empty()` was added.

### Dependencies

- `@oakoliver/bubbletea` `^1.2.0` (was `^1.0.0`), which has Bubble Tea v2.0.10 parity and the ExtendedKeyCode fix.
- `@oakoliver/bubbles` `^1.2.0` (was pinned to `1.0.1`), which has Bubbles v2.2.1 parity. It adds textarea word keys and selection to the `Text` field, and viewports keep leading whitespace.
- `@oakoliver/lipgloss` `^1.1.1` (was `^1.0.0`). 1.1.0 stripped leading whitespace when a width was set, which dropped the indentation of unselected Select/MultiSelect options. 1.1.1 fixes this, and a regression test covers it.

## 1.0.1

- Initial public release (port of charmbracelet/huh v2).
