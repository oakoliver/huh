/**
 * Theme — theming system for form fields.
 * Port of charmbracelet/huh theme.go (v2.0.3).
 *
 * Includes 5 built-in themes: Base, Charm, Dracula, Base16, Catppuccin.
 *
 * lipgloss styles are immutable (every setter returns a copy), so the Go
 * value-copy semantics (`t.Blurred = t.Focused`) carry over directly.
 */

import { newStyle, type Style, type Color } from "@oakoliver/lipgloss";
import { thickBorder, hiddenBorder } from "@oakoliver/lipgloss";
import { helpDefaultDarkStyles, type HelpStyles } from "@oakoliver/bubbles";

// ---------------------------------------------------------------------------
// Style structures
// ---------------------------------------------------------------------------

/** TextInputStyles are the styles for text inputs. */
export interface TextInputStyles {
  cursor: Style;
  cursorText: Style;
  placeholder: Style;
  prompt: Style;
  text: Style;
}

/** FieldStyles are the styles for input fields. */
export interface FieldStyles {
  base: Style;
  title: Style;
  description: Style;
  errorIndicator: Style;
  errorMessage: Style;

  // Select styles.
  selectSelector: Style;
  option: Style;
  nextIndicator: Style;
  prevIndicator: Style;

  // FilePicker styles.
  directory: Style;
  file: Style;

  // Multi-select styles.
  multiSelectSelector: Style;
  selectedOption: Style;
  selectedPrefix: Style;
  unselectedOption: Style;
  unselectedPrefix: Style;

  // Textinput and textarea styles.
  textInput: TextInputStyles;

  // Confirm styles.
  focusedButton: Style;
  blurredButton: Style;

  // Card styles.
  card: Style;
  noteTitle: Style;
  next: Style;

  /** @deprecated Not part of upstream huh; kept (as an empty style) for compatibility. */
  noneStyle?: Style;
}

/** GroupStyles are the styles for a group. */
export interface GroupStyles {
  base: Style;
  title: Style;
  description: Style;
}

/** FormStyles are the styles for a form. */
export interface FormStyles {
  base: Style;
}

/** Styles is a collection of styles for components of the form. */
export interface Styles {
  form: FormStyles;
  group: GroupStyles;
  fieldSeparator: Style;
  blurred: FieldStyles;
  focused: FieldStyles;
  help: HelpStyles;
}

// ---------------------------------------------------------------------------
// Theme interface
// ---------------------------------------------------------------------------

/** Theme resolves styles based on whether the terminal has a dark background. */
export interface Theme {
  theme(isDark: boolean): Styles;
}

/** ThemeFunc is a function that implements the Theme interface. */
export class ThemeFuncImpl implements Theme {
  private fn: (isDark: boolean) => Styles;
  constructor(fn: (isDark: boolean) => Styles) {
    this.fn = fn;
  }
  theme(isDark: boolean): Styles {
    return this.fn(isDark);
  }
}

/** Creates a Theme from a function. */
export function ThemeFunc(fn: (isDark: boolean) => Styles): Theme {
  return new ThemeFuncImpl(fn);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** lipgloss.LightDark: picks the light or dark colour based on isDark. */
function lightDark(isDark: boolean): (light: Color, dark: Color) => Color {
  return (light, dark) => (isDark ? dark : light);
}

/** Shallow copy of a FieldStyles value (Go struct assignment). */
function copyFieldStyles(f: FieldStyles): FieldStyles {
  return { ...f, textInput: { ...f.textInput } };
}

function emptyFieldStyles(): FieldStyles {
  const s = newStyle();
  return {
    base: s, title: s, description: s, errorIndicator: s, errorMessage: s,
    selectSelector: s, option: s, nextIndicator: s, prevIndicator: s,
    directory: s, file: s,
    multiSelectSelector: s, selectedOption: s, selectedPrefix: s, unselectedOption: s, unselectedPrefix: s,
    textInput: { cursor: s, cursorText: s, placeholder: s, prompt: s, text: s },
    focusedButton: s, blurredButton: s,
    card: s, noteTitle: s, next: s,
    noneStyle: s,
  };
}

const buttonPaddingHorizontal = 2;
const buttonPaddingVertical = 0;

// ---------------------------------------------------------------------------
// ThemeBase
// ---------------------------------------------------------------------------

/** ThemeBase returns a new base theme with general styles to be inherited by other themes. */
export function ThemeBase(_isDark: boolean): Styles {
  const t: Styles = {
    form: { base: newStyle() },
    group: { base: newStyle(), title: newStyle(), description: newStyle() },
    fieldSeparator: newStyle().setString("\n\n"),
    focused: emptyFieldStyles(),
    blurred: emptyFieldStyles(),
    help: helpDefaultDarkStyles(),
  };

  const button = newStyle()
    .padding(buttonPaddingVertical, buttonPaddingHorizontal)
    .marginRight(1);

  // Focused styles.
  t.focused.base = newStyle().paddingLeft(1).borderStyle(thickBorder()).borderLeft(true);
  t.focused.card = t.focused.base;
  t.focused.errorIndicator = newStyle().setString(" *");
  t.focused.errorMessage = newStyle().setString(" *");
  t.focused.selectSelector = newStyle().setString("> ");
  t.focused.nextIndicator = newStyle().marginLeft(1).setString("→");
  t.focused.prevIndicator = newStyle().marginRight(1).setString("←");
  t.focused.multiSelectSelector = newStyle().setString("> ");
  t.focused.selectedPrefix = newStyle().setString("[•] ");
  t.focused.unselectedPrefix = newStyle().setString("[ ] ");
  t.focused.focusedButton = button.foreground("0").background("7");
  t.focused.blurredButton = button.foreground("7").background("0");
  t.focused.textInput.placeholder = newStyle().foreground("8");

  // Blurred styles.
  t.blurred = copyFieldStyles(t.focused);
  t.blurred.base = t.blurred.base.borderStyle(hiddenBorder());
  t.blurred.card = t.blurred.base;
  t.blurred.multiSelectSelector = newStyle().setString("  ");
  t.blurred.nextIndicator = newStyle();
  t.blurred.prevIndicator = newStyle();

  return t;
}

// ---------------------------------------------------------------------------
// ThemeCharm
// ---------------------------------------------------------------------------

/** ThemeCharm returns a new theme based on the Charm color scheme. */
export function ThemeCharm(isDark: boolean): Styles {
  const t = ThemeBase(isDark);
  const ld = lightDark(isDark);

  const normalFg = ld("252", "235");
  const indigo = ld("#5A56E0", "#7571F9");
  const cream = ld("#FFFDF5", "#FFFDF5");
  const fuchsia = "#F780E2";
  const green = ld("#02BA84", "#02BF87");
  const red = ld("#FF4672", "#ED567A");

  const f = t.focused;
  f.base = f.base.borderForeground("238");
  f.card = f.base;
  f.title = f.title.foreground(indigo).bold(true);
  f.noteTitle = f.noteTitle.foreground(indigo).bold(true).marginBottom(1);
  f.directory = f.directory.foreground(indigo);
  f.description = f.description.foreground(ld("", "243"));
  f.errorIndicator = f.errorIndicator.foreground(red);
  f.errorMessage = f.errorMessage.foreground(red);
  f.selectSelector = f.selectSelector.foreground(fuchsia);
  f.nextIndicator = f.nextIndicator.foreground(fuchsia);
  f.prevIndicator = f.prevIndicator.foreground(fuchsia);
  f.option = f.option.foreground(normalFg);
  f.multiSelectSelector = f.multiSelectSelector.foreground(fuchsia);
  f.selectedOption = f.selectedOption.foreground(green);
  f.selectedPrefix = newStyle().foreground(ld("#02CF92", "#02A877")).setString("✓ ");
  f.unselectedPrefix = newStyle().foreground(ld("", "243")).setString("• ");
  f.unselectedOption = f.unselectedOption.foreground(normalFg);
  f.focusedButton = f.focusedButton.foreground(cream).background(fuchsia);
  f.next = f.focusedButton;
  f.blurredButton = f.blurredButton.foreground(normalFg).background(ld("237", "252"));

  f.textInput.cursor = f.textInput.cursor.foreground(green);
  f.textInput.placeholder = f.textInput.placeholder.foreground(ld("248", "238"));
  f.textInput.prompt = f.textInput.prompt.foreground(fuchsia);

  t.blurred = copyFieldStyles(t.focused);
  t.blurred.base = t.focused.base.borderStyle(hiddenBorder());
  t.blurred.card = t.blurred.base;
  t.blurred.nextIndicator = newStyle();
  t.blurred.prevIndicator = newStyle();

  t.group.title = t.focused.title;
  t.group.description = t.focused.description;
  return t;
}

// ---------------------------------------------------------------------------
// ThemeDracula
// ---------------------------------------------------------------------------

/** ThemeDracula returns a new theme based on the Dracula color scheme. */
export function ThemeDracula(isDark: boolean): Styles {
  const t = ThemeBase(isDark);

  const background = "#282a36";
  const selection = "#44475a";
  const foreground = "#f8f8f2";
  const comment = "#6272a4";
  const green = "#50fa7b";
  const purple = "#bd93f9";
  const red = "#ff5555";
  const yellow = "#f1fa8c";

  const f = t.focused;
  f.base = f.base.borderForeground(selection);
  f.card = f.base;
  f.title = f.title.foreground(purple);
  f.noteTitle = f.noteTitle.foreground(purple);
  f.description = f.description.foreground(comment);
  f.errorIndicator = f.errorIndicator.foreground(red);
  f.directory = f.directory.foreground(purple);
  f.file = f.file.foreground(foreground);
  f.errorMessage = f.errorMessage.foreground(red);
  f.selectSelector = f.selectSelector.foreground(yellow);
  f.nextIndicator = f.nextIndicator.foreground(yellow);
  f.prevIndicator = f.prevIndicator.foreground(yellow);
  f.option = f.option.foreground(foreground);
  f.multiSelectSelector = f.multiSelectSelector.foreground(yellow);
  f.selectedOption = f.selectedOption.foreground(green);
  f.selectedPrefix = f.selectedPrefix.foreground(green);
  f.unselectedOption = f.unselectedOption.foreground(foreground);
  f.unselectedPrefix = f.unselectedPrefix.foreground(comment);
  f.focusedButton = f.focusedButton.foreground(yellow).background(purple).bold(true);
  f.blurredButton = f.blurredButton.foreground(foreground).background(background);

  f.textInput.cursor = f.textInput.cursor.foreground(yellow);
  f.textInput.placeholder = f.textInput.placeholder.foreground(comment);
  f.textInput.prompt = f.textInput.prompt.foreground(yellow);

  t.blurred = copyFieldStyles(t.focused);
  t.blurred.base = t.blurred.base.borderStyle(hiddenBorder());
  t.blurred.card = t.blurred.base;
  t.blurred.nextIndicator = newStyle();
  t.blurred.prevIndicator = newStyle();

  t.group.title = t.focused.title;
  t.group.description = t.focused.description;
  return t;
}

// ---------------------------------------------------------------------------
// ThemeBase16
// ---------------------------------------------------------------------------

/** ThemeBase16 returns a new theme based on the base16 color scheme. */
export function ThemeBase16(isDark: boolean): Styles {
  const t = ThemeBase(isDark);

  const f = t.focused;
  f.base = f.base.borderForeground("8");
  f.card = f.base;
  f.title = f.title.foreground("6");
  f.noteTitle = f.noteTitle.foreground("6");
  f.directory = f.directory.foreground("6");
  f.description = f.description.foreground("8");
  f.errorIndicator = f.errorIndicator.foreground("9");
  f.errorMessage = f.errorMessage.foreground("9");
  f.selectSelector = f.selectSelector.foreground("3");
  f.nextIndicator = f.nextIndicator.foreground("3");
  f.prevIndicator = f.prevIndicator.foreground("3");
  f.option = f.option.foreground("7");
  f.multiSelectSelector = f.multiSelectSelector.foreground("3");
  f.selectedOption = f.selectedOption.foreground("2");
  f.selectedPrefix = f.selectedPrefix.foreground("2");
  f.unselectedOption = f.unselectedOption.foreground("7");
  f.focusedButton = f.focusedButton.foreground("7").background("5");
  f.blurredButton = f.blurredButton.foreground("7").background("0");

  // Upstream calls TextInput.Cursor/Placeholder/Prompt.Foreground(...) here
  // without assigning the result, so those are no-ops in Go: the base
  // text-input styles are kept unchanged. Ported 1:1.

  t.blurred = copyFieldStyles(t.focused);
  t.blurred.base = t.blurred.base.borderStyle(hiddenBorder());
  t.blurred.card = t.blurred.base;
  t.blurred.noteTitle = t.blurred.noteTitle.foreground("8");
  t.blurred.title = t.blurred.noteTitle.foreground("8");

  t.blurred.textInput.prompt = t.blurred.textInput.prompt.foreground("8");
  t.blurred.textInput.text = t.blurred.textInput.text.foreground("7");

  t.blurred.nextIndicator = newStyle();
  t.blurred.prevIndicator = newStyle();

  t.group.title = t.focused.title;
  t.group.description = t.focused.description;
  return t;
}

// ---------------------------------------------------------------------------
// ThemeCatppuccin — Mocha (dark) / Latte (light), from catppuccin/go v0.3.0
// ---------------------------------------------------------------------------

const mocha = {
  base: "#1e1e2e",
  text: "#cdd6f4",
  subtext1: "#bac2de",
  subtext0: "#a6adc8",
  overlay1: "#7f849c",
  overlay0: "#6c7086",
  green: "#a6e3a1",
  red: "#f38ba8",
  pink: "#f5c2e7",
  mauve: "#cba6f7",
  rosewater: "#f5e0dc",
};

const latte = {
  base: "#eff1f5",
  text: "#4c4f69",
  subtext1: "#5c5f77",
  subtext0: "#6c6f85",
  overlay1: "#8c8fa1",
  overlay0: "#9ca0b0",
  green: "#40a02b",
  red: "#d20f39",
  pink: "#ea76cb",
  mauve: "#8839ef",
  rosewater: "#dc8a78",
};

/** ThemeCatppuccin returns a new theme based on the Catppuccin color scheme. */
export function ThemeCatppuccin(isDark: boolean): Styles {
  const t = ThemeBase(isDark);
  const p = isDark ? mocha : latte;
  const cursor = p.rosewater;

  const f = t.focused;
  f.base = f.base.borderForeground(p.subtext1);
  f.card = f.base;
  f.title = f.title.foreground(p.mauve);
  f.noteTitle = f.noteTitle.foreground(p.mauve);
  f.directory = f.directory.foreground(p.mauve);
  f.description = f.description.foreground(p.subtext0);
  f.errorIndicator = f.errorIndicator.foreground(p.red);
  f.errorMessage = f.errorMessage.foreground(p.red);
  f.selectSelector = f.selectSelector.foreground(p.pink);
  f.nextIndicator = f.nextIndicator.foreground(p.pink);
  f.prevIndicator = f.prevIndicator.foreground(p.pink);
  f.option = f.option.foreground(p.text);
  f.multiSelectSelector = f.multiSelectSelector.foreground(p.pink);
  f.selectedOption = f.selectedOption.foreground(p.green);
  f.selectedPrefix = f.selectedPrefix.foreground(p.green);
  f.unselectedPrefix = f.unselectedPrefix.foreground(p.text);
  f.unselectedOption = f.unselectedOption.foreground(p.text);
  f.focusedButton = f.focusedButton.foreground(p.base).background(p.pink);
  f.blurredButton = f.blurredButton.foreground(p.text).background(p.base);

  f.textInput.cursor = f.textInput.cursor.foreground(cursor);
  f.textInput.placeholder = f.textInput.placeholder.foreground(p.overlay0);
  f.textInput.prompt = f.textInput.prompt.foreground(p.pink);

  t.blurred = copyFieldStyles(t.focused);
  t.blurred.base = t.blurred.base.borderStyle(hiddenBorder());
  t.blurred.card = t.blurred.base;

  t.help = {
    ...t.help,
    ellipsis: t.help.ellipsis.foreground(p.subtext0),
    shortKey: t.help.shortKey.foreground(p.subtext0),
    shortDesc: t.help.shortDesc.foreground(p.overlay1),
    shortSeparator: t.help.shortSeparator.foreground(p.subtext0),
    fullKey: t.help.fullKey.foreground(p.subtext0),
    fullDesc: t.help.fullDesc.foreground(p.overlay1),
    fullSeparator: t.help.fullSeparator.foreground(p.subtext0),
  };

  t.group.title = t.focused.title;
  t.group.description = t.focused.description;
  return t;
}
