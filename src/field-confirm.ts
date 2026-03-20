/**
 * Confirm — yes/no toggle field.
 * Port of charmbracelet/huh field_confirm.go
 */

import { type Binding, matches } from "@oakoliver/bubbles";
import { type Cmd, type Msg, Batch } from "@oakoliver/bubbletea";
import { placeHorizontal, Left, type Position } from "@oakoliver/lipgloss";

import { type Accessor, EmbeddedAccessor, PointerAccessor } from "./accessor.js";
import {
  Eval, type UpdateTitleMsg, type UpdateDescriptionMsg,
  isUpdateFieldMsg, isUpdateTitleMsg, isUpdateDescriptionMsg,
} from "./eval.js";
import type { ConfirmKeyMap, KeyMap } from "./keymap.js";
import { NewDefaultKeyMap, cloneKeyMapSection } from "./keymap.js";
import { type Theme, type FieldStyles, ThemeCharm } from "./theme.js";
import {
  nextID, type FieldPosition, isFirst, isLast, NextField, PrevField,
} from "./field-input.js";
import type { Field } from "./field-input.js";

export class Confirm implements Field {
  private _accessor: Accessor<boolean>;
  private _key: string;
  private _id: number;
  private _title: Eval<string>;
  private _description: Eval<string>;
  private _affirmative: string;
  private _negative: string;
  private _buttonAlignment: Position;
  private _focused: boolean;
  private _validate: ((value: boolean) => Error | null) | null;
  private _err: Error | null;
  private _width: number;
  private _theme: Theme;
  private _hasDarkBg: boolean;
  private _keymap: ConfirmKeyMap;
  private _inline: boolean;

  constructor() {
    this._accessor = new EmbeddedAccessor<boolean>(false);
    this._key = "";
    this._id = nextID();
    this._title = new Eval<string>("");
    this._description = new Eval<string>("");
    this._affirmative = "Yes";
    this._negative = "No";
    this._buttonAlignment = Left;
    this._focused = false;
    this._validate = null;
    this._err = null;
    this._width = 0;
    this._theme = { theme: (isDark) => ThemeCharm(isDark) };
    this._hasDarkBg = true;
    this._keymap = NewDefaultKeyMap().confirm;
    this._inline = false;
  }

  // -- Builder methods --

  value(getter: () => boolean, setter: (v: boolean) => void): Confirm {
    this._accessor = new PointerAccessor<boolean>(getter, setter);
    return this;
  }

  accessor(a: Accessor<boolean>): Confirm { this._accessor = a; return this; }
  key(k: string): Confirm { this._key = k; return this; }

  title(t: string): Confirm { this._title.val = t; this._title.fn = null; return this; }
  titleFunc(fn: () => string, bindings: any): Confirm {
    this._title.fn = fn; this._title.bindings = bindings; return this;
  }

  description(d: string): Confirm { this._description.val = d; this._description.fn = null; return this; }
  descriptionFunc(fn: () => string, bindings: any): Confirm {
    this._description.fn = fn; this._description.bindings = bindings; return this;
  }

  affirmative(s: string): Confirm { this._affirmative = s; return this; }
  negative(s: string): Confirm { this._negative = s; return this; }
  inline(v: boolean): Confirm { this._inline = v; return this; }

  validate(fn: (value: boolean) => Error | null): Confirm { this._validate = fn; return this; }
  buttonAlignment(pos: Position): Confirm { this._buttonAlignment = pos; return this; }

  // -- Field interface --

  error(): Error | null { return this._err; }
  skip(): boolean { return false; }
  zoom(): boolean { return false; }
  getKey(): string { return this._key; }
  getValue(): any { return this._accessor.get(); }

  keyBinds(): Binding[] {
    const km = this._keymap;
    return [km.toggle, km.accept, km.reject, km.next, km.prev, km.submit];
  }

  focus(): Cmd {
    this._focused = true;
    return null;
  }

  blur(): Cmd {
    this._focused = false;
    this._err = null;
    return null;
  }

  init(): Cmd { return null; }

  update(msg: Msg): [Confirm, Cmd] {
    if (isUpdateFieldMsg(msg)) {
      const cmds: Cmd[] = [];
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
      return [this, cmds.length ? Batch(...cmds) : null];
    }

    if (isUpdateTitleMsg(msg)) {
      const m = msg as UpdateTitleMsg;
      if (m.id === this._id && m.hash === this._title.bindingsHash) this._title.update(m.title);
      return [this, null];
    }

    if (isUpdateDescriptionMsg(msg)) {
      const m = msg as UpdateDescriptionMsg;
      if (m.id === this._id && m.hash === this._description.bindingsHash) this._description.update(m.description);
      return [this, null];
    }

    // Key press handling
    const km = this._keymap;
    if (matches(msg, km.toggle)) {
      this._accessor.set(!this._accessor.get());
    } else if (matches(msg, km.accept)) {
      this._accessor.set(true);
    } else if (matches(msg, km.reject)) {
      this._accessor.set(false);
    } else if (matches(msg, km.next, km.submit)) {
      this._err = this._validate ? this._validate(this._accessor.get()) : null;
      if (this._err === null) return [this, () => NextField()];
    } else if (matches(msg, km.prev)) {
      this._err = this._validate ? this._validate(this._accessor.get()) : null;
      if (this._err === null) return [this, () => PrevField()];
    }

    return [this, null];
  }

  view(): string {
    const styles = this.activeStyles();
    const val = this._accessor.get();

    const yesBtn = val
      ? styles.focusedButton.render(this._affirmative)
      : styles.blurredButton.render(this._affirmative);
    const noBtn = val
      ? styles.blurredButton.render(this._negative)
      : styles.focusedButton.render(this._negative);
    const buttons = yesBtn + "  " + noBtn;

    const errInd = this._err ? styles.errorIndicator.render() : "";
    const titleStr = this._title.val
      ? styles.title.render(this._title.val) + errInd
      : "";
    const descStr = this._description.val
      ? styles.description.render(this._description.val)
      : "";

    let content: string;
    if (this._inline) {
      content = titleStr ? titleStr + " " + buttons : buttons;
    } else {
      const parts: string[] = [];
      if (titleStr) parts.push(titleStr);
      if (descStr) parts.push(descStr);
      parts.push(buttons);
      content = parts.join("\n");
    }

    if (!this._inline && this._width > 0) {
      const lines = content.split("\n");
      const last = lines.length - 1;
      lines[last] = placeHorizontal(this._width, this._buttonAlignment, lines[last]);
      content = lines.join("\n");
    }

    return styles.base.width(this._width).render(content);
  }

  // -- With* interface methods --

  withTheme(theme: Theme): Field { this._theme = theme; return this; }
  withKeyMap(k: KeyMap): Field { this._keymap = cloneKeyMapSection(k.confirm); return this; }
  withWidth(width: number): Field { this._width = width; return this; }
  withHeight(_height: number): Field { return this; }
  withPosition(p: FieldPosition): Field {
    this._keymap.prev.setEnabled(!isFirst(p));
    this._keymap.next.setEnabled(!isLast(p));
    this._keymap.submit.setEnabled(isLast(p));
    return this;
  }

  // -- Run methods (stubs) --

  async run(): Promise<void> { throw new Error("not implemented"); }
  async runAccessible(_w: any, _r: any): Promise<void> { throw new Error("not implemented"); }

  // -- Private --

  private activeStyles(): FieldStyles {
    const s = this._theme.theme(this._hasDarkBg);
    return this._focused ? s.focused : s.blurred;
  }
}

/** Creates a new Confirm field with defaults. */
export function NewConfirm(): Confirm {
  return new Confirm();
}
