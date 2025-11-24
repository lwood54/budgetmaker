import type { HTMLInputAttributes } from 'svelte/elements';

/**
 * Represents a form field that can be used with custom form components.
 * This type is compatible with form libraries like Superforms that provide
 * field objects with validation and attribute methods.
 */
export type FormField = {
  /**
   * Returns HTML input attributes for the field.
   * @param args - Arguments passed to the field's as() method
   * @returns HTMLInputAttributes object
   */
  as(...args: any[]): HTMLInputAttributes;
  /**
   * Returns validation issues for the field, if any.
   * @returns Array of issue objects with message property, or undefined if no issues
   */
  issues(): Array<{ message: string }> | undefined;
};
