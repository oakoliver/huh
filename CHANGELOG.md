# Changelog

## 1.1.2 — field.run()

### Fixed

- **`field.run()` works.** `run()` on Input, Text, Select, MultiSelect, Confirm, Note and FilePicker threw "not implemented" although the types declare it. As upstream `func (f *Field) Run() error { return Run(f) }`, each now runs the field as a one-field form, so `await NewSelect()…run()` behaves like `await Run(select)`, including `ErrUserAborted` on Ctrl+C.

### Not yet ported

- **Accessible mode.** `field.runAccessible()` and `form.withAccessible(true)` still do not prompt; upstream asks for each field in plain text.

## 1.1.1 — upstream themes, field spacing and README

Same upstream target as 1.1.0 (huh v2.0.3 + `main` @ `ffb6a97`). Divergences found while making screenshots, each checked against upstream Go output.

### Fixed

- **Field spacing.** Every theme's `fieldSeparator` is `"\n\n"` again, as in upstream `ThemeBase`, so fields have a blank line between them. It used to be `"\n"`.
- **Themes rewritten from upstream `theme.go`.** The five built-in themes (Base, Charm, Dracula, Base16, Catppuccin) had been approximated and now follow `theme.go` style by style. `ThemeCharm` was pink everywhere; it now has indigo titles, green selections and cream-on-fuchsia buttons, with upstream's light/dark pairs. `ThemeDracula` uses purple titles and yellow selectors, `ThemeBase16` uses ANSI 6/3/2/5 (including upstream's no-op text-input assignments), and `ThemeCatppuccin` uses mauve titles, rosewater cursor, subtext border and themed help. `ThemeBase` now carries only upstream's structure: buttons with margin, placeholder colour 8, `→`/`←` indicators and bubbles' default help styles. A test compares every style (colours, border, padding, margin, bold, faint, strings) in both variants against a dump of upstream.
- **`FieldStyles` matches upstream.** Adds `noteTitle`, `next` and `textInput.cursorText`. `noneStyle` is now optional and deprecated.
- **Light/dark detection in fields.** Fields started out dark and ignored `BackgroundColorMsg`, so their light variants were never used. As in upstream, they now start light and follow `BackgroundColorMsg`.
- **Note** uses `noteTitle` and `next` (Charm: bold indigo title with a blank line under it). Its description renderer is upstream's: `_italic_`, `*bold*`, `` `code` `` and backslash escapes.
- **Select (inline)** always draws `←`/`→`, faint at either end, and shows "No matches" when the filter matches nothing.
- **Confirm** view ported from upstream: a blank line between the header and the buttons, buttons joined with their margin, `y`/`n` help labels from the button text, and upstream's help key order.
- **Input/Text width.** The text input and textarea were sized to the full field width, so their padding wrapped onto extra lines. They now subtract the frame (and the prompt, for Input) like upstream, and Input honours `charLimit` when that is narrower. Input only restyles the focused state, and Text uses upstream's cursor-line and cursor colour.
- **Form height.** On `WindowSizeMsg` the form sizes groups from their content height (upstream `rawHeight`) and no longer adds an extra blank line. A new group's starting height leaves out the help footer, as upstream does.
- **README.** The examples used `.value({ value })`, `.theme(ThemeCharm())`, `Run(form)` and methods that do not exist. They now use `.value(getter, setter)`, `.withTheme(ThemeFunc(...))` and `form.run()`. Each example was type-checked, and the interactive ones were run in a pty.

### Dependencies

- `@oakoliver/lipgloss` `^1.1.2` (upstream escape bytes: `ESC[m` resets) and `@oakoliver/bubbles` `^1.2.1` (OSC parsing fix).

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
