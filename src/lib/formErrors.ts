/**
 * Field-level validation, shared by both search forms.
 *
 * Pressing "suggest me destinations" with an empty form used to do nothing at
 * all — `if (!tripType) return;` and `if (validLegs.length < 2) return;`, with
 * no message anywhere. From the outside that is indistinguishable from a
 * broken button, and the usual reaction is to press it again.
 *
 * Two rules this encodes:
 *
 *  - **Every missing field says so, in its own place.** One summary at the
 *    top of a form makes the reader hunt for which box it means.
 *  - **The page moves to the first problem.** On a phone the field at fault
 *    is often off-screen, so a message nobody scrolls to is a message nobody
 *    reads.
 */

export type FieldErrors = Record<string, string>;

/**
 * Scroll to the first field with an error and put the cursor in it.
 *
 * Keyed by the order the caller lists, not the object's own key order, so the
 * form jumps to the *topmost* problem rather than whichever one the
 * validator happened to find first.
 */
export function focusFirstError(errors: FieldErrors, order: string[]): void {
  const firstKey = order.find((k) => errors[k]);
  if (!firstKey) return;
  if (typeof document === "undefined") return;

  const el = document.querySelector<HTMLElement>(`[data-field="${firstKey}"]`);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "center" });
  // A button or input inside the wrapper is what should actually take focus;
  // fall back to the wrapper when there is neither.
  const focusable = el.matches("input,select,button,textarea")
    ? el
    : el.querySelector<HTMLElement>("input,select,button,textarea");
  focusable?.focus({ preventScroll: true });
}

/** True when the object has at least one message in it. */
export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}
