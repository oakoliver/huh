/**
 * Eval — cached evaluation of dynamic field properties.
 * Port of charmbracelet/huh eval.go
 *
 * In Go, eval uses hashstructure to detect when bindings change.
 * We use JSON.stringify-based hashing for the same purpose.
 */

/** Simple hash function using JSON.stringify. */
function hashBindings(bindings: any): number {
  try {
    const str = JSON.stringify(bindings);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      hash = ((hash << 5) - hash + ch) | 0;
    }
    return hash;
  } catch {
    return 0;
  }
}

/** Eval provides cached evaluation of dynamic field values. */
export class Eval<T> {
  val: T;
  fn: (() => T) | null;
  bindings: any;
  bindingsHash: number;
  loading: boolean;
  cache: Map<number, T>;

  constructor(defaultVal: T) {
    this.val = defaultVal;
    this.fn = null;
    this.bindings = undefined;
    this.bindingsHash = 0;
    this.loading = false;
    this.cache = new Map();
  }

  /**
   * shouldUpdate checks if the bindings have changed and returns
   * [shouldUpdate, newHash].
   */
  shouldUpdate(): [boolean, number] {
    if (!this.fn) return [false, 0];
    const hash = hashBindings(this.bindings);
    if (hash === this.bindingsHash) return [false, hash];
    return [true, hash];
  }

  /**
   * loadFromCache checks if we have a cached value for the current hash
   * and loads it if so.
   */
  loadFromCache(): boolean {
    if (this.cache.has(this.bindingsHash)) {
      this.val = this.cache.get(this.bindingsHash)!;
      this.loading = false;
      return true;
    }
    return false;
  }

  /** update stores the new value and caches it. */
  update(val: T): void {
    this.val = val;
    this.cache.set(this.bindingsHash, val);
    this.loading = false;
  }
}

// Message types for dynamic updates

export interface UpdateTitleMsg {
  _tag: "updateTitleMsg";
  id: number;
  title: string;
  hash: number;
}

export interface UpdateDescriptionMsg {
  _tag: "updateDescriptionMsg";
  id: number;
  description: string;
  hash: number;
}

export interface UpdatePlaceholderMsg {
  _tag: "updatePlaceholderMsg";
  id: number;
  placeholder: string;
  hash: number;
}

export interface UpdateSuggestionsMsg {
  _tag: "updateSuggestionsMsg";
  id: number;
  suggestions: string[];
  hash: number;
}

export interface UpdateOptionsMsg<T> {
  _tag: "updateOptionsMsg";
  id: number;
  options: T[];
  hash: number;
}

export interface UpdateFieldMsg {
  _tag: "updateFieldMsg";
}

export const updateFieldMsg: UpdateFieldMsg = { _tag: "updateFieldMsg" };

export function isUpdateFieldMsg(msg: any): msg is UpdateFieldMsg {
  return msg && msg._tag === "updateFieldMsg";
}

export function isUpdateTitleMsg(msg: any): msg is UpdateTitleMsg {
  return msg && msg._tag === "updateTitleMsg";
}

export function isUpdateDescriptionMsg(msg: any): msg is UpdateDescriptionMsg {
  return msg && msg._tag === "updateDescriptionMsg";
}

export function isUpdatePlaceholderMsg(msg: any): msg is UpdatePlaceholderMsg {
  return msg && msg._tag === "updatePlaceholderMsg";
}

export function isUpdateSuggestionsMsg(msg: any): msg is UpdateSuggestionsMsg {
  return msg && msg._tag === "updateSuggestionsMsg";
}

export function isUpdateOptionsMsg<T>(msg: any): msg is UpdateOptionsMsg<T> {
  return msg && msg._tag === "updateOptionsMsg";
}
