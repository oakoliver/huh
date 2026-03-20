/**
 * Accessor — read/write access to field values.
 * Port of charmbracelet/huh accessor.go
 */

/** Accessor provides read/write access to field values. */
export interface Accessor<T> {
  get(): T;
  set(value: T): void;
}

/** EmbeddedAccessor is the default accessor, storing the value internally. */
export class EmbeddedAccessor<T> implements Accessor<T> {
  private value: T;

  constructor(initial: T) {
    this.value = initial;
  }

  get(): T {
    return this.value;
  }

  set(value: T): void {
    this.value = value;
  }
}

/**
 * PointerAccessor wraps an external object property for read/write access.
 * In TypeScript we use a getter/setter pair since we don't have pointers.
 */
export class PointerAccessor<T> implements Accessor<T> {
  private _get: () => T;
  private _set: (v: T) => void;

  constructor(getter: () => T, setter: (v: T) => void) {
    this._get = getter;
    this._set = setter;
  }

  get(): T {
    return this._get();
  }

  set(value: T): void {
    this._set(value);
  }
}
