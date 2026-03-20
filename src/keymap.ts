/**
 * KeyMap — keybindings for form navigation.
 * Port of charmbracelet/huh keymap.go
 */

import {
  type Binding,
  newBinding,
  withKeys,
  withHelp,
  withDisabled,
} from "@oakoliver/bubbles";

/** InputKeyMap is the keybindings for input fields. */
export interface InputKeyMap {
  acceptSuggestion: Binding;
  next: Binding;
  prev: Binding;
  submit: Binding;
}

/** TextKeyMap is the keybindings for text fields. */
export interface TextKeyMap {
  next: Binding;
  prev: Binding;
  newLine: Binding;
  editor: Binding;
  submit: Binding;
}

/** SelectKeyMap is the keybindings for select fields. */
export interface SelectKeyMap {
  next: Binding;
  prev: Binding;
  up: Binding;
  down: Binding;
  halfPageUp: Binding;
  halfPageDown: Binding;
  gotoTop: Binding;
  gotoBottom: Binding;
  left: Binding;
  right: Binding;
  filter: Binding;
  setFilter: Binding;
  clearFilter: Binding;
  submit: Binding;
}

/** MultiSelectKeyMap is the keybindings for multi-select fields. */
export interface MultiSelectKeyMap {
  next: Binding;
  prev: Binding;
  up: Binding;
  down: Binding;
  halfPageUp: Binding;
  halfPageDown: Binding;
  gotoTop: Binding;
  gotoBottom: Binding;
  toggle: Binding;
  filter: Binding;
  setFilter: Binding;
  clearFilter: Binding;
  submit: Binding;
  selectAll: Binding;
  selectNone: Binding;
}

/** FilePickerKeyMap is the keybindings for filepicker fields. */
export interface FilePickerKeyMap {
  open: Binding;
  close: Binding;
  gotoTop: Binding;
  gotoBottom: Binding;
  pageUp: Binding;
  pageDown: Binding;
  back: Binding;
  select: Binding;
  up: Binding;
  down: Binding;
  prev: Binding;
  next: Binding;
  submit: Binding;
}

/** NoteKeyMap is the keybindings for note fields. */
export interface NoteKeyMap {
  next: Binding;
  prev: Binding;
  submit: Binding;
}

/** ConfirmKeyMap is the keybindings for confirm fields. */
export interface ConfirmKeyMap {
  next: Binding;
  prev: Binding;
  toggle: Binding;
  submit: Binding;
  accept: Binding;
  reject: Binding;
}

/** KeyMap is the keybindings to navigate the form. */
export interface KeyMap {
  quit: Binding;
  confirm: ConfirmKeyMap;
  filePicker: FilePickerKeyMap;
  input: InputKeyMap;
  multiSelect: MultiSelectKeyMap;
  note: NoteKeyMap;
  select: SelectKeyMap;
  text: TextKeyMap;
}

/**
 * Clones a Binding, creating a new independent instance with the same keys,
 * help text, and enabled/disabled state.
 *
 * This is necessary because in Go, struct assignment copies the value (each
 * field gets its own copy of the keymap). In TypeScript, object assignment
 * copies references, so without cloning, all fields sharing a keymap would
 * share the same Binding instances — and withPosition() on one field would
 * overwrite the state set by withPosition() on another.
 */
export function cloneBinding(b: Binding): Binding {
  const h = b.help();
  const c = newBinding(withKeys(...b.keys()), withHelp(h.key, h.desc));
  c.setEnabled(b.enabled());
  return c;
}

/**
 * Deep-clones a keymap section object, cloning every Binding property.
 * Works with any keymap sub-type (InputKeyMap, TextKeyMap, etc.).
 */
export function cloneKeyMapSection<T>(km: T): T {
  const result: any = {};
  for (const key of Object.keys(km as any)) {
    result[key] = cloneBinding((km as any)[key]);
  }
  return result as T;
}

/** NewDefaultKeyMap returns a new default keymap. */
export function NewDefaultKeyMap(): KeyMap {
  return {
    quit: newBinding(withKeys("ctrl+c")),
    input: {
      acceptSuggestion: newBinding(withKeys("ctrl+e"), withHelp("ctrl+e", "complete")),
      prev: newBinding(withKeys("shift+tab"), withHelp("shift+tab", "back")),
      next: newBinding(withKeys("enter", "tab"), withHelp("enter", "next")),
      submit: newBinding(withKeys("enter"), withHelp("enter", "submit")),
    },
    filePicker: {
      gotoTop: newBinding(withKeys("g"), withHelp("g", "first"), withDisabled()),
      gotoBottom: newBinding(withKeys("G"), withHelp("G", "last"), withDisabled()),
      pageUp: newBinding(withKeys("K", "pgup"), withHelp("pgup", "page up"), withDisabled()),
      pageDown: newBinding(withKeys("J", "pgdown"), withHelp("pgdown", "page down"), withDisabled()),
      back: newBinding(withKeys("h", "backspace", "left", "esc"), withHelp("h", "back"), withDisabled()),
      select: newBinding(withKeys("enter"), withHelp("enter", "select"), withDisabled()),
      up: newBinding(withKeys("up", "k", "ctrl+k", "ctrl+p"), withHelp("\u2191", "up"), withDisabled()),
      down: newBinding(withKeys("down", "j", "ctrl+j", "ctrl+n"), withHelp("\u2193", "down"), withDisabled()),
      open: newBinding(withKeys("l", "right", "enter"), withHelp("enter", "open")),
      close: newBinding(withKeys("esc"), withHelp("esc", "close"), withDisabled()),
      prev: newBinding(withKeys("shift+tab"), withHelp("shift+tab", "back")),
      next: newBinding(withKeys("tab"), withHelp("tab", "next")),
      submit: newBinding(withKeys("enter"), withHelp("enter", "submit")),
    },
    text: {
      prev: newBinding(withKeys("shift+tab"), withHelp("shift+tab", "back")),
      next: newBinding(withKeys("tab", "enter"), withHelp("enter", "next")),
      submit: newBinding(withKeys("enter"), withHelp("enter", "submit")),
      newLine: newBinding(withKeys("alt+enter", "ctrl+j"), withHelp("alt+enter / ctrl+j", "new line")),
      editor: newBinding(withKeys("ctrl+e"), withHelp("ctrl+e", "open editor")),
    },
    select: {
      prev: newBinding(withKeys("shift+tab"), withHelp("shift+tab", "back")),
      next: newBinding(withKeys("enter", "tab"), withHelp("enter", "select")),
      submit: newBinding(withKeys("enter"), withHelp("enter", "submit")),
      up: newBinding(withKeys("up", "k", "ctrl+k", "ctrl+p"), withHelp("\u2191", "up")),
      down: newBinding(withKeys("down", "j", "ctrl+j", "ctrl+n"), withHelp("\u2193", "down")),
      left: newBinding(withKeys("h", "left"), withHelp("\u2190", "left"), withDisabled()),
      right: newBinding(withKeys("l", "right"), withHelp("\u2192", "right"), withDisabled()),
      filter: newBinding(withKeys("/"), withHelp("/", "filter")),
      setFilter: newBinding(withKeys("esc"), withHelp("esc", "set filter"), withDisabled()),
      clearFilter: newBinding(withKeys("esc"), withHelp("esc", "clear filter"), withDisabled()),
      halfPageUp: newBinding(withKeys("ctrl+u"), withHelp("ctrl+u", "\u00bd page up")),
      halfPageDown: newBinding(withKeys("ctrl+d"), withHelp("ctrl+d", "\u00bd page down")),
      gotoTop: newBinding(withKeys("home", "g"), withHelp("g/home", "go to start")),
      gotoBottom: newBinding(withKeys("end", "G"), withHelp("G/end", "go to end")),
    },
    multiSelect: {
      prev: newBinding(withKeys("shift+tab"), withHelp("shift+tab", "back")),
      next: newBinding(withKeys("enter", "tab"), withHelp("enter", "confirm")),
      submit: newBinding(withKeys("enter"), withHelp("enter", "submit")),
      toggle: newBinding(withKeys("space", "x"), withHelp("x", "toggle")),
      up: newBinding(withKeys("up", "k", "ctrl+p"), withHelp("\u2191", "up")),
      down: newBinding(withKeys("down", "j", "ctrl+n"), withHelp("\u2193", "down")),
      filter: newBinding(withKeys("/"), withHelp("/", "filter")),
      setFilter: newBinding(withKeys("enter", "esc"), withHelp("esc", "set filter"), withDisabled()),
      clearFilter: newBinding(withKeys("esc"), withHelp("esc", "clear filter"), withDisabled()),
      halfPageUp: newBinding(withKeys("ctrl+u"), withHelp("ctrl+u", "\u00bd page up")),
      halfPageDown: newBinding(withKeys("ctrl+d"), withHelp("ctrl+d", "\u00bd page down")),
      gotoTop: newBinding(withKeys("home", "g"), withHelp("g/home", "go to start")),
      gotoBottom: newBinding(withKeys("end", "G"), withHelp("G/end", "go to end")),
      selectAll: newBinding(withKeys("ctrl+a"), withHelp("ctrl+a", "select all")),
      selectNone: newBinding(withKeys("ctrl+a"), withHelp("ctrl+a", "select none"), withDisabled()),
    },
    note: {
      prev: newBinding(withKeys("shift+tab"), withHelp("shift+tab", "back")),
      next: newBinding(withKeys("enter", "tab"), withHelp("enter", "next")),
      submit: newBinding(withKeys("enter"), withHelp("enter", "submit")),
    },
    confirm: {
      prev: newBinding(withKeys("shift+tab"), withHelp("shift+tab", "back")),
      next: newBinding(withKeys("enter", "tab"), withHelp("enter", "next")),
      submit: newBinding(withKeys("enter"), withHelp("enter", "submit")),
      toggle: newBinding(withKeys("h", "l", "right", "left"), withHelp("\u2190/\u2192", "toggle")),
      accept: newBinding(withKeys("y", "Y"), withHelp("y", "Yes")),
      reject: newBinding(withKeys("n", "N"), withHelp("n", "No")),
    },
  };
}
