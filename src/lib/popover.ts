/**
 * Keep a floating panel inside the window.
 *
 * The calendar and the travellers counter hang off a field that can sit
 * anywhere: the last column of a four-column row, or near the bottom of a
 * hero that fills the screen. Anchored naively they run off the side of the
 * page or below the fold, and what the visitor sees is half a control with no
 * obvious way to reach the rest of it — which is exactly what happened when
 * the planner moved into the hero.
 *
 * Two deliberate choices here:
 *
 * It is a **ref callback**, not an effect with state. The measurement has to
 * happen in the same frame the panel appears; routing it through a re-render
 * paints the panel in the wrong place first and then jumps it.
 *
 * Sideways it nudges with a **transform**, so the panel keeps its ordinary
 * anchored position — correct in the common case, and correct in both writing
 * directions — and only moves when that position would put part of it off the
 * screen. Upward it re-anchors to the *bottom*, so a panel that grows after it
 * opens (the travellers counter does, one row per child) grows into the space
 * above rather than back down over the field.
 */
const MARGIN = 12;

export function keepPopoverOnScreen(node: HTMLElement | null) {
  if (!node) return;

  // Measure unshifted, so a second open doesn't compound the first nudge.
  node.style.transform = "";
  node.style.top = "";
  node.style.bottom = "";
  node.style.marginTop = "";
  node.style.marginBottom = "";

  const rect = node.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let x = 0;
  if (rect.left < MARGIN) x = MARGIN - rect.left;
  else if (rect.right > vw - MARGIN) x = vw - MARGIN - rect.right;
  if (x !== 0) node.style.transform = `translateX(${Math.round(x)}px)`;

  // Below the fold: flip above the field when there is room for the whole
  // panel there, and scroll it into view when there is not.
  //
  // It used to flip only when the panel *mostly* didn't fit, on the theory
  // that throwing a 34rem calendar over the headline to save thirty pixels
  // of scrolling was the worse trade. It isn't: a calendar whose last row of
  // dates sits under the edge of the window reads as broken, and the scroll
  // that was supposed to rescue it does nothing when the panel is anchored
  // inside a section that is already fully in view. Any overflow at all now
  // flips it.
  const overflow = rect.bottom - (vh - MARGIN);
  if (overflow > 0) {
    const trigger = node.parentElement?.querySelector("button");
    const triggerTop = trigger ? trigger.getBoundingClientRect().top : rect.top;
    const roomAbove = triggerTop - 8 - rect.height > MARGIN;
    if (roomAbove) {
      node.style.top = "auto";
      node.style.bottom = "100%";
      node.style.marginTop = "0";
      node.style.marginBottom = "0.5rem";
    } else {
      node.scrollIntoView({ block: "nearest" });
    }
  }
}
