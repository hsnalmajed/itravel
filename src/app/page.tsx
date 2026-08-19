import { headers } from "next/headers";
import { redirect } from "next/navigation";

const locales = ["ar", "en"];
const defaultLocale = "ar";

export default async function RootPage() {
  const h = await headers();
  const acceptLanguage = h.get("accept-language") || "";
  const preferred = acceptLanguage.split(",")[0]?.split("-")[0]?.toLowerCase();
  const locale = locales.includes(preferred) ? preferred : defaultLocale;
  redirect(`/${locale}`);
}
