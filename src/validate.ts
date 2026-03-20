/**
 * Validate — validation helpers for form fields.
 * Port of charmbracelet/huh validate.go
 */

/** ValidateFunc is a function that validates a value and returns an error string or null. */
export type ValidateFunc = (value: string) => string | null;

/**
 * ValidateNotEmpty validates that a string is not empty.
 * Returns an error message if the string is empty.
 */
export function ValidateNotEmpty(): (value: string) => Error | null {
  return (value: string) => {
    if (value.trim() === "") {
      return new Error("value cannot be empty");
    }
    return null;
  };
}

/**
 * ValidateMinLength validates that a string has at least n characters.
 */
export function ValidateMinLength(n: number): (value: string) => Error | null {
  return (value: string) => {
    if (value.length < n) {
      return new Error(`value must be at least ${n} characters`);
    }
    return null;
  };
}

/**
 * ValidateMaxLength validates that a string has at most n characters.
 */
export function ValidateMaxLength(n: number): (value: string) => Error | null {
  return (value: string) => {
    if (value.length > n) {
      return new Error(`value must be at most ${n} characters`);
    }
    return null;
  };
}

/**
 * ValidateLength validates that a string has exactly n characters.
 */
export function ValidateLength(n: number): (value: string) => Error | null {
  return (value: string) => {
    if (value.length !== n) {
      return new Error(`value must be exactly ${n} characters`);
    }
    return null;
  };
}
