// Children's ages travel through URLs/POST bodies as a compact
// comma-separated string (e.g. "3,7,11") rather than JSON, to keep query
// strings short and avoid encoding edge cases.
export function parseChildrenAges(raw: string | null | undefined): number[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0);
}

export function serializeChildrenAges(ages: number[]): string {
  return ages.join(",");
}
