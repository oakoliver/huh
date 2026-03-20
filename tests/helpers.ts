/**
 * Shared test helpers — mirrors the Go test helpers from huh_test.go.
 */
import { KeyPressMsg, KeyCode, KeyMod, type Cmd, type Msg, Batch } from "@oakoliver/bubbletea";
import { stripAnsi } from "@oakoliver/lipgloss";
import type { Form } from "../src/form.js";

/** Interface matching bubbletea Model (for batchUpdate). */
interface Model {
  update(msg: Msg): [Model, Cmd];
  view(): string;
}

/**
 * Creates a KeyPressMsg for a printable character.
 * Equivalent to Go `keypress(r rune)`.
 */
export function keypress(r: string): KeyPressMsg {
  const code = r.charCodeAt(0);
  return new KeyPressMsg({ text: r, mod: KeyMod.None, code });
}

/**
 * Creates a KeyPressMsg for a special key code (no text).
 * Equivalent to Go `codeKeypress(r rune)`.
 */
export function codeKeypress(code: number): KeyPressMsg {
  return new KeyPressMsg({ text: "", mod: KeyMod.None, code });
}

/**
 * Creates a KeyPressMsg with a modifier.
 */
export function modKeypress(mod: KeyMod, code: number): KeyPressMsg {
  return new KeyPressMsg({ text: "", mod, code });
}

/**
 * Runs a command and its follow-up once (two-level batch).
 * Equivalent to Go `batchUpdate(m Model, cmd tea.Cmd) Model`.
 */
export function batchUpdate(m: Model, cmd?: Cmd): Model;
export function batchUpdate(result: [Model, Cmd]): Model;
export function batchUpdate(mOrResult: Model | [Model, Cmd], cmd?: Cmd): Model {
  let m: Model;
  let c: Cmd;
  if (Array.isArray(mOrResult)) {
    [m, c] = mOrResult;
  } else {
    m = mOrResult;
    c = cmd ?? null;
  }

  if (!c) return m;
  const msg = c();
  const [m2, c2] = m.update(msg);
  if (!c2) return m2;
  const msg2 = c2();
  const [m3] = m2.update(msg2);
  return m3;
}

/**
 * Types a string of characters into a model.
 * Equivalent to Go `typeText[T Model](m T, s string) T`.
 */
export function typeText<T extends Model>(m: T, s: string): T {
  let current: Model = m;
  for (const ch of s) {
    const [next] = current.update(keypress(ch));
    current = next;
  }
  return current as T;
}

/**
 * Strips ANSI from a model's view.
 * Equivalent to Go `viewModel(m Model) string`.
 */
export function viewModel(m: { view(): string }): string {
  return stripAnsi(m.view());
}

/**
 * Recursively resolves all commands from a form update, including
 * BatchMsg unwrapping. This mirrors Go's doAllUpdates exactly.
 *
 * Go's doAllUpdates:
 *   func doAllUpdates(f *Form, cmd tea.Cmd) {
 *     if cmd == nil { return }
 *     switch msg := cmd().(type) {
 *     case tea.BatchMsg:
 *       for _, subcommand := range msg { doAllUpdates(f, subcommand) }
 *       return
 *     default:
 *       _, result := f.Update(msg)
 *       doAllUpdates(f, tea.Batch(result))
 *     }
 *   }
 */
export function doAllUpdates(f: Form, cmd: Cmd): void {
  if (!cmd) return;
  const msg = cmd();
  if (!msg) return;
  if ((msg as any)?._tag === "BatchMsg") {
    const batchMsg = msg as any;
    if (Array.isArray(batchMsg.cmds)) {
      for (const subcmd of batchMsg.cmds) {
        doAllUpdates(f, subcmd);
      }
    }
    return;
  }
  const [, resultCmd] = f.update(msg as Msg);
  if (resultCmd) {
    doAllUpdates(f, resultCmd);
  }
}
