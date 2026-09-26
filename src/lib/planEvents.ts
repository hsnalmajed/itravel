/**
 * "Open the planner on flights (or hotels)", from anywhere on the homepage.
 *
 * The planner lives in the hero, at the top. The showcase's "plan your trip"
 * tab, further down, offers the same two choices — and choosing one should
 * open *that* planner, not draw a second copy of the form lower on the page
 * (two forms would mean two sets of the same field ids and two searches that
 * drift apart). So the tab announces the choice and the hero's planner, which
 * listens, opens it and scrolls itself into view.
 */

export type PlanProduct = "flights" | "hotels";

export const PLAN_EVENT = "sfrtna:open-planner";

export function openPlanner(product: PlanProduct) {
  window.dispatchEvent(new CustomEvent<PlanProduct>(PLAN_EVENT, { detail: product }));
}
