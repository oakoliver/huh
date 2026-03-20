/**
 * Theme — theming system for form fields.
 * Port of charmbracelet/huh theme.go
 *
 * Includes 5 built-in themes: Base, Charm, Dracula, Base16, Catppuccin.
 */

import { newStyle, type Style } from "@oakoliver/lipgloss";
import {
  normalBorder,
  roundedBorder,
  thickBorder,
  hiddenBorder,
} from "@oakoliver/lipgloss";
import type { HelpStyles } from "@oakoliver/bubbles";

// ---------------------------------------------------------------------------
// Style structures
// ---------------------------------------------------------------------------

/** TextInputStyles are the styles for text input fields. */
export interface TextInputStyles {
  cursor: Style;
  placeholder: Style;
  prompt: Style;
  text: Style;
}

/** FieldStyles are the styles for a field. */
export interface FieldStyles {
  base: Style;
  title: Style;
  description: Style;
  errorIndicator: Style;
  errorMessage: Style;
  selectSelector: Style;
  nextIndicator: Style;
  prevIndicator: Style;
  option: Style;
  multiSelectSelector: Style;
  selectedOption: Style;
  selectedPrefix: Style;
  unselectedOption: Style;
  unselectedPrefix: Style;
  focusedButton: Style;
  blurredButton: Style;
  textInput: TextInputStyles;
  card: Style;
  noneStyle: Style;
  directory: Style;
  file: Style;
}

/** GroupStyles are the styles for a group of fields. */
export interface GroupStyles {
  base: Style;
  title: Style;
  description: Style;
}

/** FormStyles are the styles for the form. */
export interface FormStyles {
  base: Style;
}

/** Styles is the full set of styles for a themed form. */
export interface Styles {
  form: FormStyles;
  group: GroupStyles;
  fieldSeparator: Style;
  focused: FieldStyles;
  blurred: FieldStyles;
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
// Color helper — lipgloss.LightDark equivalent
// ---------------------------------------------------------------------------

/** Returns the light or dark color based on the isDark flag. */
function lightDark(isDark: boolean): (light: string, dark: string) => string {
  return (light: string, dark: string) => (isDark ? dark : light);
}

// ---------------------------------------------------------------------------
// Button padding constants
// ---------------------------------------------------------------------------
const buttonPaddingHorizontal = 2;
const buttonPaddingVertical = 0;

// ---------------------------------------------------------------------------
// ThemeBase — the base theme
// ---------------------------------------------------------------------------

export function ThemeBase(isDark: boolean): Styles {
  const f = lightDark(isDark);

  const focused: FieldStyles = {
    base: newStyle().paddingLeft(1).borderStyle(thickBorder()).borderLeft(true).borderForeground(f("8", "7")),
    title: newStyle().foreground(f("8", "7")),
    description: newStyle().foreground(f("8", "7")),
    errorIndicator: newStyle().foreground(f("8", "7")).setString(" *"),
    errorMessage: newStyle().foreground(f("8", "7")),
    selectSelector: newStyle().foreground(f("8", "7")).setString("> "),
    nextIndicator: newStyle().foreground(f("8", "7")).setString("  \u2193 "),
    prevIndicator: newStyle().foreground(f("8", "7")).setString("  \u2191 "),
    option: newStyle().foreground(f("15", "0")),
    multiSelectSelector: newStyle().foreground(f("8", "7")).setString("> "),
    selectedOption: newStyle().foreground(f("8", "7")),
    selectedPrefix: newStyle().foreground(f("8", "7")).setString("[\u2022] "),
    unselectedOption: newStyle().foreground(f("15", "0")),
    unselectedPrefix: newStyle().foreground(f("8", "7")).setString("[ ] "),
    focusedButton: newStyle().foreground(f("15", "0")).background(f("8", "7")).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    blurredButton: newStyle().foreground(f("15", "0")).background(f("0", "15")).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    textInput: {
      cursor: newStyle().foreground(f("8", "7")),
      placeholder: newStyle().foreground(f("8", "7")),
      prompt: newStyle().foreground(f("8", "7")),
      text: newStyle().foreground(f("15", "0")),
    },
    card: newStyle().paddingLeft(1),
    noneStyle: newStyle(),
    directory: newStyle().foreground(f("4", "12")),
    file: newStyle(),
  };

  const blurred: FieldStyles = {
    base: newStyle().paddingLeft(1).borderStyle(hiddenBorder()).borderLeft(true),
    title: newStyle().foreground(f("8", "7")),
    description: newStyle().foreground(f("8", "7")),
    errorIndicator: newStyle().foreground(f("8", "7")).setString(" *"),
    errorMessage: newStyle().foreground(f("8", "7")),
    selectSelector: newStyle().foreground(f("8", "7")).setString("> "),
    nextIndicator: newStyle().foreground(f("8", "7")).setString("  \u2193 "),
    prevIndicator: newStyle().foreground(f("8", "7")).setString("  \u2191 "),
    option: newStyle().foreground(f("15", "0")),
    multiSelectSelector: newStyle().foreground(f("8", "7")).setString("> "),
    selectedOption: newStyle().foreground(f("8", "7")),
    selectedPrefix: newStyle().foreground(f("8", "7")).setString("[\u2022] "),
    unselectedOption: newStyle().foreground(f("15", "0")),
    unselectedPrefix: newStyle().foreground(f("8", "7")).setString("[ ] "),
    focusedButton: newStyle().foreground(f("15", "0")).background(f("8", "7")).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    blurredButton: newStyle().foreground(f("15", "0")).background(f("0", "15")).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    textInput: {
      cursor: newStyle().foreground(f("8", "7")),
      placeholder: newStyle().foreground(f("8", "7")),
      prompt: newStyle().foreground(f("8", "7")),
      text: newStyle().foreground(f("15", "0")),
    },
    card: newStyle().paddingLeft(1),
    noneStyle: newStyle(),
    directory: newStyle().foreground(f("4", "12")),
    file: newStyle(),
  };

  return {
    form: { base: newStyle() },
    group: {
      base: newStyle(),
      title: newStyle().foreground(f("8", "7")),
      description: newStyle().foreground(f("8", "7")),
    },
    fieldSeparator: newStyle().setString("\n"),
    focused,
    blurred,
    help: {
      ellipsis: newStyle().foreground(f("8", "7")),
      shortKey: newStyle().foreground(f("8", "7")),
      shortDesc: newStyle().foreground(f("8", "7")),
      shortSeparator: newStyle().foreground(f("8", "7")),
      fullKey: newStyle().foreground(f("8", "7")),
      fullDesc: newStyle().foreground(f("8", "7")),
      fullSeparator: newStyle().foreground(f("8", "7")),
    },
  };
}

// ---------------------------------------------------------------------------
// ThemeCharm
// ---------------------------------------------------------------------------

export function ThemeCharm(isDark: boolean): Styles {
  const f = lightDark(isDark);

  const focused: FieldStyles = {
    base: newStyle().paddingLeft(1).borderStyle(thickBorder()).borderLeft(true).borderForeground(f("205", "212")),
    title: newStyle().foreground(f("205", "212")),
    description: newStyle().foreground(f("243", "243")),
    errorIndicator: newStyle().foreground(f("196", "196")).setString(" *"),
    errorMessage: newStyle().foreground(f("196", "196")),
    selectSelector: newStyle().foreground(f("205", "212")).setString("> "),
    nextIndicator: newStyle().foreground(f("205", "212")).setString("  \u2193 "),
    prevIndicator: newStyle().foreground(f("205", "212")).setString("  \u2191 "),
    option: newStyle().foreground(f("15", "255")),
    multiSelectSelector: newStyle().foreground(f("205", "212")).setString("> "),
    selectedOption: newStyle().foreground(f("205", "212")),
    selectedPrefix: newStyle().foreground(f("205", "212")).setString("\u2713 "),
    unselectedOption: newStyle().foreground(f("15", "255")),
    unselectedPrefix: newStyle().foreground(f("243", "243")).setString("\u2022 "),
    focusedButton: newStyle().foreground(f("255", "255")).background(f("205", "212")).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    blurredButton: newStyle().foreground(f("15", "255")).background(f("0", "0")).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    textInput: {
      cursor: newStyle().foreground(f("205", "212")),
      placeholder: newStyle().foreground(f("243", "243")),
      prompt: newStyle().foreground(f("205", "212")),
      text: newStyle().foreground(f("15", "255")),
    },
    card: newStyle().paddingLeft(1),
    noneStyle: newStyle(),
    directory: newStyle().foreground(f("4", "12")),
    file: newStyle(),
  };

  const blurred: FieldStyles = {
    base: newStyle().paddingLeft(1).borderStyle(hiddenBorder()).borderLeft(true),
    title: newStyle().foreground(f("243", "243")),
    description: newStyle().foreground(f("243", "243")),
    errorIndicator: newStyle().foreground(f("196", "196")).setString(" *"),
    errorMessage: newStyle().foreground(f("196", "196")),
    selectSelector: newStyle().foreground(f("243", "243")).setString("> "),
    nextIndicator: newStyle().foreground(f("243", "243")).setString("  \u2193 "),
    prevIndicator: newStyle().foreground(f("243", "243")).setString("  \u2191 "),
    option: newStyle().foreground(f("243", "243")),
    multiSelectSelector: newStyle().foreground(f("243", "243")).setString("> "),
    selectedOption: newStyle().foreground(f("205", "212")),
    selectedPrefix: newStyle().foreground(f("205", "212")).setString("\u2713 "),
    unselectedOption: newStyle().foreground(f("243", "243")),
    unselectedPrefix: newStyle().foreground(f("243", "243")).setString("\u2022 "),
    focusedButton: newStyle().foreground(f("255", "255")).background(f("205", "212")).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    blurredButton: newStyle().foreground(f("15", "255")).background(f("0", "0")).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    textInput: {
      cursor: newStyle().foreground(f("205", "212")),
      placeholder: newStyle().foreground(f("243", "243")),
      prompt: newStyle().foreground(f("205", "212")),
      text: newStyle().foreground(f("243", "243")),
    },
    card: newStyle().paddingLeft(1),
    noneStyle: newStyle(),
    directory: newStyle().foreground(f("4", "12")),
    file: newStyle(),
  };

  return {
    form: { base: newStyle() },
    group: {
      base: newStyle(),
      title: newStyle().foreground(f("205", "212")).bold(true),
      description: newStyle().foreground(f("243", "243")),
    },
    fieldSeparator: newStyle().setString("\n"),
    focused,
    blurred,
    help: {
      ellipsis: newStyle().foreground(f("243", "243")),
      shortKey: newStyle().foreground(f("243", "243")),
      shortDesc: newStyle().foreground(f("243", "243")),
      shortSeparator: newStyle().foreground(f("243", "243")),
      fullKey: newStyle().foreground(f("243", "243")),
      fullDesc: newStyle().foreground(f("243", "243")),
      fullSeparator: newStyle().foreground(f("243", "243")),
    },
  };
}

// ---------------------------------------------------------------------------
// ThemeDracula
// ---------------------------------------------------------------------------

export function ThemeDracula(isDark: boolean): Styles {
  const f = lightDark(isDark);
  // Dracula palette
  const _purple = "#bd93f9";
  const _pink = "#ff79c6";
  const _red = "#ff5555";
  const _fg = f("#282a36", "#f8f8f2");
  const _bg = f("#f8f8f2", "#282a36");
  const _comment = "#6272a4";
  const _green = "#50fa7b";

  const focused: FieldStyles = {
    base: newStyle().paddingLeft(1).borderStyle(thickBorder()).borderLeft(true).borderForeground(_pink),
    title: newStyle().foreground(_pink),
    description: newStyle().foreground(_comment),
    errorIndicator: newStyle().foreground(_red).setString(" *"),
    errorMessage: newStyle().foreground(_red),
    selectSelector: newStyle().foreground(_pink).setString("> "),
    nextIndicator: newStyle().foreground(_pink).setString("  \u2193 "),
    prevIndicator: newStyle().foreground(_pink).setString("  \u2191 "),
    option: newStyle().foreground(_fg),
    multiSelectSelector: newStyle().foreground(_pink).setString("> "),
    selectedOption: newStyle().foreground(_green),
    selectedPrefix: newStyle().foreground(_green).setString("[\u2022] "),
    unselectedOption: newStyle().foreground(_fg),
    unselectedPrefix: newStyle().foreground(_comment).setString("[ ] "),
    focusedButton: newStyle().foreground(_bg).background(_pink).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    blurredButton: newStyle().foreground(_fg).background(_bg).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    textInput: {
      cursor: newStyle().foreground(_pink),
      placeholder: newStyle().foreground(_comment),
      prompt: newStyle().foreground(_pink),
      text: newStyle().foreground(_fg),
    },
    card: newStyle().paddingLeft(1),
    noneStyle: newStyle(),
    directory: newStyle().foreground(_purple),
    file: newStyle(),
  };

  const blurred: FieldStyles = {
    base: newStyle().paddingLeft(1).borderStyle(hiddenBorder()).borderLeft(true),
    title: newStyle().foreground(_comment),
    description: newStyle().foreground(_comment),
    errorIndicator: newStyle().foreground(_red).setString(" *"),
    errorMessage: newStyle().foreground(_red),
    selectSelector: newStyle().foreground(_comment).setString("> "),
    nextIndicator: newStyle().foreground(_comment).setString("  \u2193 "),
    prevIndicator: newStyle().foreground(_comment).setString("  \u2191 "),
    option: newStyle().foreground(_comment),
    multiSelectSelector: newStyle().foreground(_comment).setString("> "),
    selectedOption: newStyle().foreground(_green),
    selectedPrefix: newStyle().foreground(_green).setString("[\u2022] "),
    unselectedOption: newStyle().foreground(_comment),
    unselectedPrefix: newStyle().foreground(_comment).setString("[ ] "),
    focusedButton: newStyle().foreground(_bg).background(_pink).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    blurredButton: newStyle().foreground(_fg).background(_bg).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    textInput: {
      cursor: newStyle().foreground(_pink),
      placeholder: newStyle().foreground(_comment),
      prompt: newStyle().foreground(_pink),
      text: newStyle().foreground(_comment),
    },
    card: newStyle().paddingLeft(1),
    noneStyle: newStyle(),
    directory: newStyle().foreground(_purple),
    file: newStyle(),
  };

  return {
    form: { base: newStyle() },
    group: {
      base: newStyle(),
      title: newStyle().foreground(_pink).bold(true),
      description: newStyle().foreground(_comment),
    },
    fieldSeparator: newStyle().setString("\n"),
    focused,
    blurred,
    help: {
      ellipsis: newStyle().foreground(_comment),
      shortKey: newStyle().foreground(_comment),
      shortDesc: newStyle().foreground(_comment),
      shortSeparator: newStyle().foreground(_comment),
      fullKey: newStyle().foreground(_comment),
      fullDesc: newStyle().foreground(_comment),
      fullSeparator: newStyle().foreground(_comment),
    },
  };
}

// ---------------------------------------------------------------------------
// ThemeBase16
// ---------------------------------------------------------------------------

export function ThemeBase16(isDark: boolean): Styles {
  const f = lightDark(isDark);

  const focused: FieldStyles = {
    base: newStyle().paddingLeft(1).borderStyle(thickBorder()).borderLeft(true).borderForeground(f("4", "12")),
    title: newStyle().foreground(f("4", "12")),
    description: newStyle().foreground(f("8", "7")),
    errorIndicator: newStyle().foreground(f("1", "9")).setString(" *"),
    errorMessage: newStyle().foreground(f("1", "9")),
    selectSelector: newStyle().foreground(f("4", "12")).setString("> "),
    nextIndicator: newStyle().foreground(f("4", "12")).setString("  \u2193 "),
    prevIndicator: newStyle().foreground(f("4", "12")).setString("  \u2191 "),
    option: newStyle().foreground(f("15", "0")),
    multiSelectSelector: newStyle().foreground(f("4", "12")).setString("> "),
    selectedOption: newStyle().foreground(f("2", "10")),
    selectedPrefix: newStyle().foreground(f("2", "10")).setString("[\u2022] "),
    unselectedOption: newStyle().foreground(f("15", "0")),
    unselectedPrefix: newStyle().foreground(f("8", "7")).setString("[ ] "),
    focusedButton: newStyle().foreground(f("15", "0")).background(f("4", "12")).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    blurredButton: newStyle().foreground(f("15", "0")).background(f("0", "15")).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    textInput: {
      cursor: newStyle().foreground(f("4", "12")),
      placeholder: newStyle().foreground(f("8", "7")),
      prompt: newStyle().foreground(f("4", "12")),
      text: newStyle().foreground(f("15", "0")),
    },
    card: newStyle().paddingLeft(1),
    noneStyle: newStyle(),
    directory: newStyle().foreground(f("4", "12")),
    file: newStyle(),
  };

  const blurred: FieldStyles = {
    base: newStyle().paddingLeft(1).borderStyle(hiddenBorder()).borderLeft(true),
    title: newStyle().foreground(f("8", "7")),
    description: newStyle().foreground(f("8", "7")),
    errorIndicator: newStyle().foreground(f("1", "9")).setString(" *"),
    errorMessage: newStyle().foreground(f("1", "9")),
    selectSelector: newStyle().foreground(f("8", "7")).setString("> "),
    nextIndicator: newStyle().foreground(f("8", "7")).setString("  \u2193 "),
    prevIndicator: newStyle().foreground(f("8", "7")).setString("  \u2191 "),
    option: newStyle().foreground(f("8", "7")),
    multiSelectSelector: newStyle().foreground(f("8", "7")).setString("> "),
    selectedOption: newStyle().foreground(f("2", "10")),
    selectedPrefix: newStyle().foreground(f("2", "10")).setString("[\u2022] "),
    unselectedOption: newStyle().foreground(f("8", "7")),
    unselectedPrefix: newStyle().foreground(f("8", "7")).setString("[ ] "),
    focusedButton: newStyle().foreground(f("15", "0")).background(f("4", "12")).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    blurredButton: newStyle().foreground(f("15", "0")).background(f("0", "15")).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    textInput: {
      cursor: newStyle().foreground(f("4", "12")),
      placeholder: newStyle().foreground(f("8", "7")),
      prompt: newStyle().foreground(f("4", "12")),
      text: newStyle().foreground(f("8", "7")),
    },
    card: newStyle().paddingLeft(1),
    noneStyle: newStyle(),
    directory: newStyle().foreground(f("4", "12")),
    file: newStyle(),
  };

  return {
    form: { base: newStyle() },
    group: {
      base: newStyle(),
      title: newStyle().foreground(f("4", "12")).bold(true),
      description: newStyle().foreground(f("8", "7")),
    },
    fieldSeparator: newStyle().setString("\n"),
    focused,
    blurred,
    help: {
      ellipsis: newStyle().foreground(f("8", "7")),
      shortKey: newStyle().foreground(f("8", "7")),
      shortDesc: newStyle().foreground(f("8", "7")),
      shortSeparator: newStyle().foreground(f("8", "7")),
      fullKey: newStyle().foreground(f("8", "7")),
      fullDesc: newStyle().foreground(f("8", "7")),
      fullSeparator: newStyle().foreground(f("8", "7")),
    },
  };
}

// ---------------------------------------------------------------------------
// ThemeCatppuccin — uses Mocha (dark) / Latte (light) palettes
// ---------------------------------------------------------------------------

// Catppuccin Mocha palette (dark)
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

// Catppuccin Latte palette (light)
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

export function ThemeCatppuccin(isDark: boolean): Styles {
  const p = isDark ? mocha : latte;

  const focused: FieldStyles = {
    base: newStyle().paddingLeft(1).borderStyle(thickBorder()).borderLeft(true).borderForeground(p.pink),
    title: newStyle().foreground(p.pink),
    description: newStyle().foreground(p.overlay1),
    errorIndicator: newStyle().foreground(p.red).setString(" *"),
    errorMessage: newStyle().foreground(p.red),
    selectSelector: newStyle().foreground(p.pink).setString("> "),
    nextIndicator: newStyle().foreground(p.pink).setString("  \u2193 "),
    prevIndicator: newStyle().foreground(p.pink).setString("  \u2191 "),
    option: newStyle().foreground(p.text),
    multiSelectSelector: newStyle().foreground(p.pink).setString("> "),
    selectedOption: newStyle().foreground(p.green),
    selectedPrefix: newStyle().foreground(p.green).setString("[\u2022] "),
    unselectedOption: newStyle().foreground(p.text),
    unselectedPrefix: newStyle().foreground(p.overlay1).setString("[ ] "),
    focusedButton: newStyle().foreground(p.base).background(p.pink).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    blurredButton: newStyle().foreground(p.text).background(p.base).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    textInput: {
      cursor: newStyle().foreground(p.pink),
      placeholder: newStyle().foreground(p.overlay0),
      prompt: newStyle().foreground(p.pink),
      text: newStyle().foreground(p.text),
    },
    card: newStyle().paddingLeft(1),
    noneStyle: newStyle(),
    directory: newStyle().foreground(p.mauve),
    file: newStyle(),
  };

  const blurred: FieldStyles = {
    base: newStyle().paddingLeft(1).borderStyle(hiddenBorder()).borderLeft(true),
    title: newStyle().foreground(p.subtext0),
    description: newStyle().foreground(p.overlay0),
    errorIndicator: newStyle().foreground(p.red).setString(" *"),
    errorMessage: newStyle().foreground(p.red),
    selectSelector: newStyle().foreground(p.overlay0).setString("> "),
    nextIndicator: newStyle().foreground(p.overlay0).setString("  \u2193 "),
    prevIndicator: newStyle().foreground(p.overlay0).setString("  \u2191 "),
    option: newStyle().foreground(p.overlay1),
    multiSelectSelector: newStyle().foreground(p.overlay0).setString("> "),
    selectedOption: newStyle().foreground(p.green),
    selectedPrefix: newStyle().foreground(p.green).setString("[\u2022] "),
    unselectedOption: newStyle().foreground(p.overlay1),
    unselectedPrefix: newStyle().foreground(p.overlay0).setString("[ ] "),
    focusedButton: newStyle().foreground(p.base).background(p.pink).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    blurredButton: newStyle().foreground(p.text).background(p.base).padding(buttonPaddingVertical, buttonPaddingHorizontal),
    textInput: {
      cursor: newStyle().foreground(p.pink),
      placeholder: newStyle().foreground(p.overlay0),
      prompt: newStyle().foreground(p.pink),
      text: newStyle().foreground(p.overlay0),
    },
    card: newStyle().paddingLeft(1),
    noneStyle: newStyle(),
    directory: newStyle().foreground(p.mauve),
    file: newStyle(),
  };

  return {
    form: { base: newStyle() },
    group: {
      base: newStyle(),
      title: newStyle().foreground(p.pink).bold(true),
      description: newStyle().foreground(p.overlay1),
    },
    fieldSeparator: newStyle().setString("\n"),
    focused,
    blurred,
    help: {
      ellipsis: newStyle().foreground(p.overlay0),
      shortKey: newStyle().foreground(p.overlay0),
      shortDesc: newStyle().foreground(p.overlay0),
      shortSeparator: newStyle().foreground(p.overlay0),
      fullKey: newStyle().foreground(p.overlay0),
      fullDesc: newStyle().foreground(p.overlay0),
      fullSeparator: newStyle().foreground(p.overlay0),
    },
  };
}
