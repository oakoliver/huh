/**
 * Text field — port of charmbracelet/huh field_text.go
 * Multi-line text input wrapping a TextareaModel.
 */

import { newTextarea, type TextareaModel, type Binding, matches } from "@oakoliver/bubbles";
import { type Cmd, type Msg, Batch, type KeyPressMsg } from "@oakoliver/bubbletea";
import { type Accessor, EmbeddedAccessor, PointerAccessor } from "./accessor.js";
import {
  Eval, type UpdateTitleMsg, type UpdateDescriptionMsg, type UpdatePlaceholderMsg,
  isUpdateFieldMsg, isUpdateTitleMsg, isUpdateDescriptionMsg, isUpdatePlaceholderMsg,
} from "./eval.js";
import type { TextKeyMap, KeyMap } from "./keymap.js";
import { NewDefaultKeyMap, cloneKeyMapSection } from "./keymap.js";
import { type Theme, type FieldStyles, ThemeCharm } from "./theme.js";
import { nextID, type FieldPosition, isFirst, isLast, NextField, PrevField } from "./field-input.js";
import type { Field } from "./field-input.js";

// ---------------------------------------------------------------------------
// Text field
// ---------------------------------------------------------------------------

export class Text implements Field {
  private _accessor: Accessor<string>;
  private _key: string;
  private _id: number;
  private _title: Eval<string>;
  private _description: Eval<string>;
  private _placeholder: Eval<string>;
  private _textarea: TextareaModel;
  private _focused: boolean;
  private _validate: ((val: string) => Error | null) | null;
  private _err: Error | null;
  private _width: number;
  private _theme: Theme;
  private _hasDarkBg: boolean;
  private _keymap: TextKeyMap;
  private _editorEnabled: boolean;

  constructor() {
    this._accessor = new EmbeddedAccessor<string>("");
    this._key = "";
    this._id = nextID();
    this._title = new Eval<string>("");
    this._description = new Eval<string>("");
    this._placeholder = new Eval<string>("");
    this._textarea = newTextarea();
    this._textarea.showLineNumbers = false;
    this._textarea.prompt = "";
    this._focused = false;
    this._validate = null;
    this._err = null;
    this._width = 0;
    this._theme = { theme: (isDark) => ThemeCharm(isDark) };
    this._hasDarkBg = true;
    this._keymap = NewDefaultKeyMap().text;
    this._editorEnabled = true;
    // Map newLine keys to textarea's insertNewline keymap
    if (this._textarea.keyMap?.insertNewline) {
      this._textarea.keyMap.insertNewline.setKeys(...this._keymap.newLine.keys());
    }
  }

  // -- Builder methods --

  value(getter: () => string, setter: (v: string) => void): Text {
    this._accessor = new PointerAccessor(getter, setter);
    return this;
  }

  accessor(a: Accessor<string>): Text { this._accessor = a; return this; }
  key(k: string): Text { this._key = k; return this; }
  title(t: string): Text { this._title.val = t; this._title.fn = null; return this; }

  titleFunc(fn: () => string, bindings: any): Text {
    this._title.fn = fn; this._title.bindings = bindings; return this;
  }

  description(d: string): Text { this._description.val = d; this._description.fn = null; return this; }

  descriptionFunc(fn: () => string, bindings: any): Text {
    this._description.fn = fn; this._description.bindings = bindings; return this;
  }

  placeholder(p: string): Text {
    this._placeholder.val = p; this._placeholder.fn = null;
    this._textarea.placeholder = p; return this;
  }

  placeholderFunc(fn: () => string, bindings: any): Text {
    this._placeholder.fn = fn; this._placeholder.bindings = bindings; return this;
  }

  lines(n: number): Text { this._textarea.setHeight(n); return this; }
  charLimit(n: number): Text { this._textarea.charLimit = n; return this; }
  showLineNumbers(b: boolean): Text { this._textarea.showLineNumbers = b; return this; }
  validate(fn: (val: string) => Error | null): Text { this._validate = fn; return this; }

  externalEditor(b: boolean): Text {
    this._editorEnabled = b;
    this._keymap.editor.setEnabled(b);
    return this;
  }

  editor(..._args: string[]): Text {
    // External editor not supported in TS port
    return this;
  }

  editorExtension(_ext: string): Text {
    // External editor not supported in TS port
    return this;
  }

  // -- Field interface --

  error(): Error | null { return this._err; }
  skip(): boolean { return false; }
  zoom(): boolean { return false; }
  getKey(): string { return this._key; }
  getValue(): any { return this._accessor.get(); }

  keyBinds(): Binding[] {
    const binds: Binding[] = [this._keymap.newLine];
    if (this._editorEnabled) binds.push(this._keymap.editor);
    binds.push(this._keymap.prev, this._keymap.next, this._keymap.submit);
    return binds;
  }

  private activeStyles(): FieldStyles {
    const styles = this._theme.theme(this._hasDarkBg);
    return this._focused ? styles.focused : styles.blurred;
  }

  focus(): Cmd {
    this._focused = true;
    this._textarea.setValue(this._accessor.get());
    this._textarea.focus();
    return null;
  }

  blur(): Cmd {
    this._focused = false;
    this._accessor.set(this._textarea.value());
    if (this._validate) this._err = this._validate(this._accessor.get());
    this._textarea.blur();
    return null;
  }

  init(): Cmd { return null; }

  update(msg: Msg): [Text, Cmd] {
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
      [should, hash] = this._placeholder.shouldUpdate();
      if (should) {
        this._placeholder.bindingsHash = hash;
        if (!this._placeholder.loadFromCache()) {
          this._placeholder.loading = true;
          const id = this._id;
          const fn = this._placeholder.fn!;
          cmds.push(() => ({ _tag: "updatePlaceholderMsg", id, placeholder: fn(), hash } as UpdatePlaceholderMsg));
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
    if (isUpdatePlaceholderMsg(msg)) {
      const m = msg as UpdatePlaceholderMsg;
      if (m.id === this._id && m.hash === this._placeholder.bindingsHash) {
        this._placeholder.update(m.placeholder);
        this._textarea.placeholder = m.placeholder;
      }
    }

    if ((msg as any)?._tag === "KeyPressMsg") {
      const km = msg as KeyPressMsg;
      if (matches(km, this._keymap.next) || matches(km, this._keymap.submit)) {
        this._accessor.set(this._textarea.value());
        if (this._validate) {
          this._err = this._validate(this._accessor.get());
          if (this._err) return [this, null];
        }
        return [this, () => NextField()];
      } else if (matches(km, this._keymap.prev)) {
        this._accessor.set(this._textarea.value());
        if (this._validate) {
          this._err = this._validate(this._accessor.get());
          if (this._err) return [this, null];
        }
        return [this, () => PrevField()];
      }
    }

    const [, cmd] = this._textarea.update(msg);
    if (cmd) cmds.push(cmd);
    this._accessor.set(this._textarea.value());

    return [this, cmds.length > 0 ? Batch(...cmds) : null];
  }

  view(): string {
    const styles = this.activeStyles();
    const ti = styles.textInput;

    const cursorColor = ti.cursor.getForeground();
    const existing = this._textarea.getStyles();
    const stateOverrides = { placeholder: ti.placeholder, text: ti.text, prompt: ti.prompt };
    this._textarea.setStyles({
      focused: { ...existing.focused, ...stateOverrides },
      blurred: { ...existing.blurred, ...stateOverrides },
      cursor: { ...existing.cursor, color: typeof cursorColor === "string" ? cursorColor : existing.cursor.color },
    });

    const parts: string[] = [];
    if (this._title.val) {
      let titleStr = styles.title.render(this._title.val);
      if (this._err) titleStr += styles.errorIndicator.render();
      parts.push(titleStr);
    }
    if (this._description.val) {
      parts.push(styles.description.render(this._description.val));
    }
    parts.push(this._textarea.view());

    const body = parts.join("\n");
    return styles.base.width(this._width).render(body);
  }

  // -- With* interface methods --

  withTheme(theme: Theme): Field { this._theme = theme; return this; }

  withKeyMap(k: KeyMap): Field {
    this._keymap = cloneKeyMapSection(k.text);
    if (this._textarea.keyMap?.insertNewline) {
      this._textarea.keyMap.insertNewline.setKeys(...this._keymap.newLine.keys());
    }
    return this;
  }

  withWidth(width: number): Field {
    this._width = width;
    this._textarea.setWidth(width);
    return this;
  }

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
}

/** Creates a new Text field with defaults. */
export function NewText(): Text {
  return new Text();
}
