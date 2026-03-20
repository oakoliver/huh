/**
 * Input field — port of charmbracelet/huh field_input.go
 */
import { newTextInput, TextInputModel, type Binding, matches, EchoMode } from "@oakoliver/bubbles";
import { type Cmd, type Msg, Batch, type KeyPressMsg } from "@oakoliver/bubbletea";
import { joinHorizontal, Left } from "@oakoliver/lipgloss";
import { type Accessor, EmbeddedAccessor, PointerAccessor } from "./accessor.js";
import {
  Eval, type UpdateTitleMsg, type UpdateDescriptionMsg, type UpdatePlaceholderMsg,
  type UpdateSuggestionsMsg, isUpdateFieldMsg, isUpdateTitleMsg,
  isUpdateDescriptionMsg, isUpdatePlaceholderMsg, isUpdateSuggestionsMsg,
} from "./eval.js";
import type { InputKeyMap, KeyMap } from "./keymap.js";
import { NewDefaultKeyMap, cloneKeyMapSection } from "./keymap.js";
import { type Theme, type FieldStyles, ThemeCharm } from "./theme.js";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

let lastID = 0;
export function nextID(): number { return ++lastID; }

export interface FieldPosition {
  group: number; field: number;
  firstField: number; lastField: number;
  groupCount: number; firstGroup: number; lastGroup: number;
}

export function isFirst(p: FieldPosition): boolean {
  return p.field === p.firstField && p.group === p.firstGroup;
}
export function isLast(p: FieldPosition): boolean {
  return p.field === p.lastField && p.group === p.lastGroup;
}

export interface Field {
  init(): Cmd;
  update(msg: Msg): [Field, Cmd];
  view(): string;
  blur(): Cmd;
  focus(): Cmd;
  error(): Error | null;
  run(): Promise<void>;
  runAccessible(w: any, r: any): Promise<void>;
  skip(): boolean;
  zoom(): boolean;
  keyBinds(): Binding[];
  withTheme(theme: Theme): Field;
  withKeyMap(k: KeyMap): Field;
  withWidth(width: number): Field;
  withHeight(height: number): Field;
  withPosition(p: FieldPosition): Field;
  getKey(): string;
  getValue(): any;
}

// ---------------------------------------------------------------------------
// Navigation messages
// ---------------------------------------------------------------------------

export interface NextFieldMsg { _tag: "nextFieldMsg"; }
export interface PrevFieldMsg { _tag: "prevFieldMsg"; }
export function NextField(): Msg { return { _tag: "nextFieldMsg" } as NextFieldMsg; }
export function PrevField(): Msg { return { _tag: "prevFieldMsg" } as PrevFieldMsg; }
export function isNextFieldMsg(msg: any): msg is NextFieldMsg { return msg?._tag === "nextFieldMsg"; }
export function isPrevFieldMsg(msg: any): msg is PrevFieldMsg { return msg?._tag === "prevFieldMsg"; }

// ---------------------------------------------------------------------------
// Eval update helper
// ---------------------------------------------------------------------------

function checkEvalUpdate<T>(ev: Eval<T>, id: number, tag: string, cmds: Cmd[]): void {
  const [should, hash] = ev.shouldUpdate();
  if (!should) return;
  ev.bindingsHash = hash;
  if (ev.loadFromCache()) return;
  ev.loading = true;
  const fn = ev.fn!;
  cmds.push(() => ({ _tag: tag, id, [tag === "updateSuggestionsMsg" ? "suggestions" : tag === "updatePlaceholderMsg" ? "placeholder" : tag === "updateDescriptionMsg" ? "description" : "title"]: fn(), hash }));
}

// ---------------------------------------------------------------------------
// Input field
// ---------------------------------------------------------------------------

export class Input implements Field {
  private _accessor: Accessor<string>;
  private _key = "";
  private _id: number;
  private _title = new Eval("");
  private _description = new Eval("");
  private _placeholder = new Eval("");
  private _suggestions = new Eval<string[]>([]);
  private _textinput: TextInputModel;
  private _focused = false;
  private _validate: ((val: string) => Error | null) | null = null;
  private _err: Error | null = null;
  private _width = 0;
  private _inline = false;
  private _prompt = "> ";
  private _theme: Theme = { theme: (d) => ThemeCharm(d) };
  private _hasDarkBg = true;
  private _keymap: InputKeyMap;

  constructor() {
    this._accessor = new EmbeddedAccessor("");
    this._id = nextID();
    this._textinput = newTextInput();
    this._keymap = NewDefaultKeyMap().input;
    this._textinput.prompt = this._prompt;
  }

  // -- Builder methods --

  value(getter: () => string, setter: (v: string) => void): Input {
    this._accessor = new PointerAccessor(getter, setter); return this;
  }
  accessor(a: Accessor<string>): Input { this._accessor = a; return this; }
  key(k: string): Input { this._key = k; return this; }
  title(t: string): Input { this._title.val = t; this._title.fn = null; return this; }
  titleFunc(fn: () => string, bindings: any): Input {
    this._title.fn = fn; this._title.bindings = bindings; return this;
  }
  description(d: string): Input { this._description.val = d; this._description.fn = null; return this; }
  descriptionFunc(fn: () => string, bindings: any): Input {
    this._description.fn = fn; this._description.bindings = bindings; return this;
  }
  placeholder(p: string): Input {
    this._placeholder.val = p; this._placeholder.fn = null;
    this._textinput.placeholder = p; return this;
  }
  placeholderFunc(fn: () => string, bindings: any): Input {
    this._placeholder.fn = fn; this._placeholder.bindings = bindings; return this;
  }
  suggestions(s: string[]): Input {
    this._suggestions.val = s; this._suggestions.fn = null;
    this._textinput.setSuggestions(s); this._textinput.showSuggestions = true; return this;
  }
  suggestionsFunc(fn: () => string[], bindings: any): Input {
    this._suggestions.fn = fn; this._suggestions.bindings = bindings; return this;
  }
  charLimit(n: number): Input { this._textinput.charLimit = n; return this; }
  password(): Input { this._textinput.echoMode = EchoMode.EchoPassword; return this; }
  echoMode(m: number): Input { this._textinput.echoMode = m; return this; }
  prompt(p: string): Input { this._prompt = p; this._textinput.prompt = p; return this; }
  inline(b: boolean): Input { this._inline = b; return this; }
  validate(fn: (val: string) => Error | null): Input { this._validate = fn; return this; }

  // -- Field interface --

  error(): Error | null { return this._err; }
  skip(): boolean { return false; }
  zoom(): boolean { return false; }
  getKey(): string { return this._key; }
  getValue(): any { return this._accessor.get(); }
  keyBinds(): Binding[] {
    if (this._textinput.showSuggestions) {
      return [this._keymap.acceptSuggestion, this._keymap.prev, this._keymap.submit, this._keymap.next];
    }
    return [this._keymap.prev, this._keymap.submit, this._keymap.next];
  }

  private activeStyles(): FieldStyles {
    const s = this._theme.theme(this._hasDarkBg);
    return this._focused ? s.focused : s.blurred;
  }

  focus(): Cmd {
    this._focused = true;
    this._textinput.setValue(this._accessor.get());
    return this._textinput.focus();
  }

  blur(): Cmd {
    this._focused = false;
    this._accessor.set(this._textinput.value());
    this._textinput.blur();
    return null;
  }

  // -- Tea model --

  init(): Cmd { return null; }

  update(msg: Msg): [Input, Cmd] {
    const cmds: Cmd[] = [];

    if (isUpdateFieldMsg(msg)) {
      checkEvalUpdate(this._title, this._id, "updateTitleMsg", cmds);
      checkEvalUpdate(this._description, this._id, "updateDescriptionMsg", cmds);
      checkEvalUpdate(this._placeholder, this._id, "updatePlaceholderMsg", cmds);
      checkEvalUpdate(this._suggestions, this._id, "updateSuggestionsMsg", cmds);
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
        this._textinput.placeholder = m.placeholder;
      }
    }
    if (isUpdateSuggestionsMsg(msg)) {
      const m = msg as UpdateSuggestionsMsg;
      if (m.id === this._id && m.hash === this._suggestions.bindingsHash) {
        this._suggestions.update(m.suggestions);
        this._textinput.setSuggestions(m.suggestions);
        this._textinput.showSuggestions = true;
      }
    }

    if ((msg as any)?._tag === "KeyPressMsg") {
      const km = msg as KeyPressMsg;
      if (matches(km, this._keymap.acceptSuggestion)) {
        // handled by textinput below
      } else if (matches(km, this._keymap.next) || matches(km, this._keymap.submit)) {
        this._accessor.set(this._textinput.value());
        if (this._validate) {
          this._err = this._validate(this._accessor.get());
          if (this._err) return [this, null];
        }
        return [this, () => NextField()];
      } else if (matches(km, this._keymap.prev)) {
        return [this, () => PrevField()];
      }
    }

    // Translate bubbletea PasteMsg to textinput internal paste format
    let fwdMsg = msg;
    if ((msg as any)?._tag === "PasteMsg" && typeof (msg as any).content === "string") {
      fwdMsg = { type: "textinput.paste", content: (msg as any).content };
    }

    const [, cmd] = this._textinput.update(fwdMsg);
    if (cmd) cmds.push(cmd);
    this._accessor.set(this._textinput.value());
    return [this, cmds.length > 0 ? Batch(...cmds) : null];
  }

  view(): string {
    const styles = this.activeStyles();
    const ti = styles.textInput;
    const fg = ti.cursor.getForeground();
    const prev = this._textinput.styles();
    const ss = { text: ti.text, placeholder: ti.placeholder, suggestion: ti.placeholder, prompt: ti.prompt };
    this._textinput.setStyles({
      focused: ss, blurred: ss,
      cursor: { ...prev.cursor, color: typeof fg === "string" ? fg : null },
    });

    if (this._inline) {
      // In inline mode, join title + description + textinput horizontally
      const inlineParts: string[] = [];
      if (this._title.val) {
        let t = styles.title.render(this._title.val);
        if (this._err) t += styles.errorIndicator.render();
        inlineParts.push(t);
      }
      if (this._description.val) inlineParts.push(styles.description.render(this._description.val));
      inlineParts.push(this._textinput.view());
      const body = joinHorizontal(Left, ...inlineParts);
      return styles.base.width(this._width).render(body);
    }

    const parts: string[] = [];
    if (this._title.val) {
      let t = styles.title.render(this._title.val);
      if (this._err) t += styles.errorIndicator.render();
      parts.push(t);
    }
    if (this._description.val) parts.push(styles.description.render(this._description.val));
    parts.push(this._textinput.view());
    return styles.base.width(this._width).render(parts.join("\n"));
  }

  // -- With* methods --

  withTheme(theme: Theme): Field { this._theme = theme; return this; }
  withKeyMap(k: KeyMap): Field { this._keymap = cloneKeyMapSection(k.input); return this; }
  withWidth(width: number): Field { this._width = width; this._textinput.setWidth(width); return this; }
  withHeight(_h: number): Field { return this; }
  withPosition(p: FieldPosition): Field {
    this._keymap.prev.setEnabled(!isFirst(p));
    this._keymap.next.setEnabled(!isLast(p));
    this._keymap.submit.setEnabled(isLast(p));
    return this;
  }

  // -- Run stubs --

  async run(): Promise<void> { throw new Error("not implemented"); }
  async runAccessible(_w: any, _r: any): Promise<void> { throw new Error("not implemented"); }
}

/** Creates a new Input field with defaults. */
export function NewInput(): Input { return new Input(); }
