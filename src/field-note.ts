/**
 * Note field — port of charmbracelet/huh field_note.go
 *
 * Display-only field with optional "Next" button.
 * Does not collect any data.
 */

import {
  Eval,
  type UpdateTitleMsg,
  type UpdateDescriptionMsg,
  isUpdateFieldMsg,
  isUpdateTitleMsg,
  isUpdateDescriptionMsg,
  updateFieldMsg,
} from "./eval.js";
import type { NoteKeyMap, KeyMap } from "./keymap.js";
import { NewDefaultKeyMap, cloneKeyMapSection } from "./keymap.js";
import { type Theme, type FieldStyles, ThemeFunc, ThemeCharm } from "./theme.js";
import { wrap } from "./wrap.js";
import {
  nextID,
  type FieldPosition,
  isFirst,
  isLast,
  NextField,
  PrevField,
} from "./field-input.js";
import type { Field } from "./field-input.js";
import { type Cmd, type Msg, Batch, type KeyPressMsg } from "@oakoliver/bubbletea";
import { type Binding, matches } from "@oakoliver/bubbles";
import { newStyle } from "@oakoliver/lipgloss";

// ---------------------------------------------------------------------------
// Basic markdown rendering
// ---------------------------------------------------------------------------

/** Render basic markdown: **bold**, *italic*, `code` → ANSI escapes. */
function render(s: string): string {
  s = s.replace(/\*\*(.*?)\*\*/g, "\x1b[1m$1\x1b[0m");
  s = s.replace(/\*(.*?)\*/g, "\x1b[3m$1\x1b[0m");
  s = s.replace(/`(.*?)`/g, "\x1b[7m$1\x1b[0m");
  return s;
}

// ---------------------------------------------------------------------------
// Note field
// ---------------------------------------------------------------------------

export class Note implements Field {
  private _id: number;
  private _title: Eval<string>;
  private _description: Eval<string>;
  private _showNextButton: boolean;
  private _skip: boolean;
  private _nextLabel: string;
  private _focused: boolean;
  private _width: number;
  private _height: number;
  private _theme: Theme;
  private _hasDarkBg: boolean;
  private _keymap: NoteKeyMap;

  constructor() {
    this._id = nextID();
    this._title = new Eval("");
    this._description = new Eval("");
    this._showNextButton = false;
    this._skip = true;
    this._nextLabel = "Next";
    this._focused = false;
    this._width = 0;
    this._height = 0;
    this._theme = { theme: (isDark) => ThemeCharm(isDark) };
    this._hasDarkBg = true;
    this._keymap = NewDefaultKeyMap().note;
  }

  // -- Builder methods --

  title(t: string): Note {
    this._title.val = t;
    this._title.fn = null;
    return this;
  }

  titleFunc(fn: () => string, bindings: any): Note {
    this._title.fn = fn;
    this._title.bindings = bindings;
    return this;
  }

  description(d: string): Note {
    this._description.val = d;
    this._description.fn = null;
    return this;
  }

  descriptionFunc(fn: () => string, bindings: any): Note {
    this._description.fn = fn;
    this._description.bindings = bindings;
    return this;
  }

  next(show: boolean): Note {
    this._showNextButton = show;
    return this;
  }

  nextLabel(label: string): Note {
    this._nextLabel = label;
    return this;
  }

  // -- Field interface --

  getKey(): string { return ""; }
  getValue(): any { return null; }
  error(): Error | null { return null; }
  skip(): boolean { return this._skip; }
  zoom(): boolean { return false; }

  keyBinds(): Binding[] {
    return [this._keymap.prev, this._keymap.next, this._keymap.submit];
  }

  focus(): Cmd {
    this._focused = true;
    return null;
  }

  blur(): Cmd {
    this._focused = false;
    return null;
  }

  private activeStyles(): FieldStyles {
    const styles = this._theme.theme(this._hasDarkBg);
    return this._focused ? styles.focused : styles.blurred;
  }

  // -- Tea model interface --

  init(): Cmd { return null; }

  update(msg: Msg): [Note, Cmd] {
    const cmds: Cmd[] = [];

    if (isUpdateFieldMsg(msg)) {
      let [should, hash] = this._title.shouldUpdate();
      if (should) {
        this._title.bindingsHash = hash;
        if (!this._title.loadFromCache()) {
          this._title.loading = true;
          const id = this._id;
          const fn = this._title.fn!;
          cmds.push(() => ({ _tag: "updateTitleMsg", id, title: fn(), hash } as UpdateTitleMsg));
        }
      }
      [should, hash] = this._description.shouldUpdate();
      if (should) {
        this._description.bindingsHash = hash;
        if (!this._description.loadFromCache()) {
          this._description.loading = true;
          const id = this._id;
          const fn = this._description.fn!;
          cmds.push(() => ({ _tag: "updateDescriptionMsg", id, description: fn(), hash } as UpdateDescriptionMsg));
        }
      }
    }

    if (isUpdateTitleMsg(msg)) {
      const m = msg as UpdateTitleMsg;
      if (m.id === this._id && m.hash === this._title.bindingsHash) this._title.update(m.title);
    }
    if (isUpdateDescriptionMsg(msg)) {
      const m = msg as UpdateDescriptionMsg;
      if (m.id === this._id && m.hash === this._description.bindingsHash) this._description.update(m.description);
    }

    if ((msg as any)?._tag === "KeyPressMsg") {
      const km = msg as KeyPressMsg;
      if (matches(km, this._keymap.next) || matches(km, this._keymap.submit)) {
        return [this, () => NextField()];
      }
      if (matches(km, this._keymap.prev)) {
        return [this, () => PrevField()];
      }
    }

    return [this, cmds.length > 0 ? Batch(...cmds) : null];
  }

  view(): string {
    const styles = this.activeStyles();
    const maxWidth = this._width > 0 ? this._width - styles.card.getHorizontalFrameSize() : 0;
    let sb = "";

    if (this._title.val || this._title.fn) {
      sb += styles.title.render(maxWidth > 0 ? wrap(this._title.val, maxWidth) : this._title.val);
    }
    if (this._description.val || this._description.fn) {
      sb += "\n";
      const desc = maxWidth > 0
        ? wrap(render(this._description.val), maxWidth)
        : render(this._description.val);
      sb += desc;
      sb += "\n";
    }
    if (this._showNextButton) {
      sb += "\n";
      sb += styles.focusedButton.render(this._nextLabel);
    }

    return styles.card
      .height(this._height)
      .width(this._width)
      .render(sb);
  }

  // -- With* interface methods --

  withTheme(theme: Theme): Field { this._theme = theme; return this; }
  withKeyMap(k: KeyMap): Field { this._keymap = cloneKeyMapSection(k.note); return this; }
  withWidth(width: number): Field { this._width = width; return this; }
  withHeight(height: number): Field { this._height = height; return this; }
  withPosition(p: FieldPosition): Field {
    // If the note is the only field on the screen,
    // we shouldn't skip the entire group.
    if (p.field === p.firstField && p.field === p.lastField) {
      this._skip = false;
    }
    this._keymap.prev.setEnabled(!isFirst(p));
    this._keymap.next.setEnabled(!isLast(p));
    this._keymap.submit.setEnabled(isLast(p));
    return this;
  }

  // -- Run methods (stubs) --

  async run(): Promise<void> { throw new Error("not implemented"); }
  async runAccessible(_w: any, _r: any): Promise<void> { throw new Error("not implemented"); }
}

/** Creates a new Note field with defaults. */
export function NewNote(): Note {
  return new Note();
}
