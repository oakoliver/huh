/**
 * FilePicker field — simplified port of charmbracelet/huh field_filepicker.go
 *
 * Uses a text input for path entry instead of a full filesystem browser.
 */

import { newTextInput, type TextInputModel, type Binding, matches } from "@oakoliver/bubbles";
import { type Cmd, type Msg, type KeyPressMsg } from "@oakoliver/bubbletea";
import { type Accessor, EmbeddedAccessor, PointerAccessor } from "./accessor.js";
import type { FilePickerKeyMap, KeyMap } from "./keymap.js";
import { NewDefaultKeyMap, cloneKeyMapSection } from "./keymap.js";
import { type Theme, type FieldStyles, ThemeFunc, ThemeCharm } from "./theme.js";
import {
  type FieldPosition,
  isFirst,
  isLast,
  NextField,
  PrevField,
} from "./field-input.js";
import type { Field } from "./field-input.js";

export class FilePicker implements Field {
  private _accessor: Accessor<string>;
  private _key: string;
  private _picker: TextInputModel;
  private _focused: boolean;
  private _picking: boolean;
  private _title: string;
  private _description: string;
  private _validate: (value: string) => Error | null;
  private _err: Error | null;
  private _width: number;
  private _height: number;
  private _theme: Theme;
  private _hasDarkBg: boolean;
  private _keymap: FilePickerKeyMap;
  private _allowedTypes: string[];
  private _currentDirectory: string;

  constructor() {
    this._accessor = new EmbeddedAccessor("");
    this._key = "";
    this._picker = newTextInput();
    this._picker.placeholder = "Enter file path...";
    this._picker.prompt = "> ";
    this._focused = false;
    this._picking = false;
    this._title = "";
    this._description = "";
    this._validate = () => null;
    this._err = null;
    this._width = 0;
    this._height = 0;
    this._theme = ThemeFunc(ThemeCharm);
    this._hasDarkBg = true;
    this._keymap = NewDefaultKeyMap().filePicker;
    this._allowedTypes = [];
    this._currentDirectory = ".";
  }

  // -- Builder methods --

  value(getter: () => string, setter: (v: string) => void): this {
    this._accessor = new PointerAccessor(getter, setter);
    return this;
  }

  accessor(a: Accessor<string>): this {
    this._accessor = a;
    return this;
  }

  key(k: string): this { this._key = k; return this; }
  title(t: string): this { this._title = t; return this; }
  description(d: string): this { this._description = d; return this; }
  currentDirectory(d: string): this { this._currentDirectory = d; return this; }
  allowedTypes(types: string[]): this { this._allowedTypes = types; return this; }
  picking(v: boolean): this { this._picking = v; return this; }
  height(h: number): this { this._height = h; return this; }

  validate(fn: (value: string) => Error | null): this {
    this._validate = fn;
    return this;
  }

  // -- Picking state --

  private setPickingState(v: boolean): void {
    this._picking = v;
    if (this._keymap.close) this._keymap.close.setEnabled(v);
    if (this._keymap.open) this._keymap.open.setEnabled(!v);
    if (this._keymap.select) this._keymap.select.setEnabled(v);
    if (this._keymap.up) this._keymap.up.setEnabled(v);
    if (this._keymap.down) this._keymap.down.setEnabled(v);
    if (this._keymap.back) this._keymap.back.setEnabled(v);
    if (this._keymap.gotoTop) this._keymap.gotoTop.setEnabled(v);
    if (this._keymap.gotoBottom) this._keymap.gotoBottom.setEnabled(v);
    if (this._keymap.pageUp) this._keymap.pageUp.setEnabled(v);
    if (this._keymap.pageDown) this._keymap.pageDown.setEnabled(v);
  }

  // -- Field interface --

  getKey(): string { return this._key; }
  getValue(): any { return this._accessor.get(); }
  error(): Error | null { return this._err; }
  skip(): boolean { return false; }
  zoom(): boolean { return this._picking; }

  keyBinds(): Binding[] {
    const km = this._keymap;
    return [km.open, km.close, km.prev, km.next, km.submit].filter(Boolean);
  }

  focus(): Cmd {
    this._focused = true;
    this._picker.setValue(this._accessor.get());
    return this._picking ? this._picker.focus() : null;
  }

  blur(): Cmd {
    this._focused = false;
    this.setPickingState(false);
    this._picker.blur();
    return null;
  }

  private activeStyles(): FieldStyles {
    const s = this._theme.theme(this._hasDarkBg);
    return this._focused ? s.focused : s.blurred;
  }

  init(): Cmd { return null; }

  update(msg: Msg): [this, Cmd] {
    if ((msg as any)?._tag === "KeyPressMsg") {
      const km = msg as KeyPressMsg;

      if (!this._picking && matches(km, this._keymap.open)) {
        this.setPickingState(true);
        this._picker.setValue(this._accessor.get());
        return [this, this._picker.focus()];
      }

      if (this._picking && matches(km, this._keymap.close)) {
        this.setPickingState(false);
        this._picker.blur();
        return [this, () => NextField()];
      }

      if (this._picking && matches(km, this._keymap.select)) {
        const val = this._picker.value();
        this._err = this._validate(val);
        if (this._err) return [this, null];
        this._accessor.set(val);
        this.setPickingState(false);
        this._picker.blur();
        return [this, () => NextField()];
      }

      if (!this._picking && matches(km, this._keymap.next)) {
        return [this, () => NextField()];
      }

      if (matches(km, this._keymap.prev)) {
        this.setPickingState(false);
        this._picker.blur();
        return [this, () => PrevField()];
      }
    }

    if (this._picking) {
      const [, cmd] = this._picker.update(msg);
      return [this, cmd];
    }

    return [this, null];
  }

  view(): string {
    const styles = this.activeStyles();
    const parts: string[] = [];

    if (this._title) {
      let titleStr = styles.title.render(this._title);
      if (this._err) titleStr += styles.errorIndicator.render();
      parts.push(titleStr);
    }
    if (this._description) {
      parts.push(styles.description.render(this._description));
    }

    if (this._picking) {
      const ti = styles.textInput;
      const cursorFg = ti.cursor.getForeground();
      const colorStr = typeof cursorFg === "string" ? cursorFg : null;
      const prev = this._picker.styles();
      const styleState = { text: ti.text, placeholder: ti.placeholder, suggestion: ti.placeholder, prompt: ti.prompt };
      this._picker.setStyles({
        focused: styleState, blurred: styleState,
        cursor: { ...prev.cursor, color: colorStr },
      });
      parts.push(this._picker.view());
    } else {
      const val = this._accessor.get();
      parts.push(val ? styles.selectedOption.render(val) : styles.description.render("No file selected."));
    }

    const body = parts.join("\n");
    return styles.base.width(this._width).render(body);
  }

  // -- With* interface methods --

  withTheme(theme: Theme): Field { this._theme = theme; return this; }
  withKeyMap(k: KeyMap): Field { this._keymap = cloneKeyMapSection(k.filePicker); return this; }
  withWidth(width: number): Field { this._width = width; this._picker.setWidth(width); return this; }
  withHeight(height: number): Field { this._height = height; return this; }
  withPosition(p: FieldPosition): Field {
    this._keymap.prev.setEnabled(!isFirst(p));
    this._keymap.next.setEnabled(!isLast(p));
    this._keymap.submit.setEnabled(isLast(p));
    return this;
  }

  // -- Run methods (stubs) --

  async run(): Promise<void> { return Promise.reject(new Error("not implemented")); }
  async runAccessible(_w: any, _r: any): Promise<void> { return Promise.reject(new Error("not implemented")); }
}

/** Creates a new FilePicker field with defaults. */
export function NewFilePicker(): FilePicker {
  return new FilePicker();
}
