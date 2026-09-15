/**
 * Where an airline's logo comes from.
 *
 * Carriers are recognised by their mark long before their name is read, so a
 * list of six fares reads far faster with logos down the left than with six
 * lines of grey text. The images come from Kiwi's public airline-logo CDN,
 * keyed by IATA code — the same key our own offers already carry, so nothing
 * has to be mapped or maintained by hand.
 *
 * Two deliberate limits. We only build a URL for something shaped like a real
 * IATA code, so a malformed code becomes a monogram rather than a request for
 * a file that cannot exist. And the component that renders this always has a
 * fallback: the CDN is someone else's service, and a fare list must stay
 * legible on the day it stops answering.
 */

const IATA_CODE = /^[A-Z0-9]{2,3}$/;

export function airlineLogoUrl(code: string | undefined, size: 64 | 128 = 128): string | undefined {
  const c = (code ?? "").trim().toUpperCase();
  if (!IATA_CODE.test(c)) return undefined;
  return `https://images.kiwi.com/airlines/${size}/${c}.png`;
}

/**
 * The letters to show when there is no logo.
 *
 * The airline's name, not its code: "QR" means nothing to most travellers,
 * while "QA" for Qatar Airways at least points at the right carrier.
 */
export function airlineMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
