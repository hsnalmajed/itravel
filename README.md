# iTravel

منصة تخطيط سفر ذكية: تبحث عن رحلات طيران وفنادق ضمن ميزانيتك، وتقترح خطة سياحية يومية بالذكاء الاصطناعي.
A smart trip-planning site: finds flights and hotels that fit your budget, plus an AI-generated day-by-day itinerary.

بُني بـ Next.js 16 (App Router) + TypeScript + Tailwind CSS. ثنائي اللغة (عربي RTL / إنجليزي LTR).
Built with Next.js 16 (App Router), TypeScript, Tailwind CSS. Bilingual (Arabic RTL / English LTR).

---

## 1. تشغيل المشروع محلياً / Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the keys described below (optional for demo mode)
npm run dev
```

افتح http://localhost:3000 — سيُعاد توجيهك تلقائياً إلى `/ar` أو `/en` حسب لغة المتصفح.
Open http://localhost:3000 — you'll be redirected to `/ar` or `/en` based on your browser language.

**بدون أي مفاتيح API، الموقع يعمل بالكامل في "وضع تجريبي" (Demo Mode)** يولّد بيانات طيران/فنادق واقعية عشوائياً، وخطة سياحية بقالب جاهز — حتى تتمكن من تجربة تجربة المستخدم الكاملة فوراً.
**With zero API keys configured, the site fully works in Demo Mode** — realistic randomized flight/hotel data and a template-based itinerary — so you can try the full user experience immediately.

---

## 2. ربط بيانات حقيقية / Connecting real data

هذا المشروع **لا يمكنه، ولا يجب أن يحاول، سحب بيانات مباشرة (scraping)** من booking.com أو Wego أو سكاي سكانر أو المسافر أو flynas — هذه المواقع تمنع ذلك في شروط الاستخدام الخاصة بها. الطريقة الصحيحة والقانونية هي:

This project **cannot and should not scrape** booking.com, Wego, Skyscanner, Almosafer, or flynas directly — their terms of service prohibit it. The correct, legal path is:

### أ) بيانات أسعار حقيقية عبر Duffel (جاهز الآن) / Real pricing via Duffel (ready today)

> **ملاحظة:** كان المشروع يستخدم سابقاً Amadeus for Developers، لكن أمديوس أوقفت بوابة الاشتراك الذاتي (self-service) نهائياً في 17 يوليو 2026 وأصبحت تتطلب عملية مبيعات للمؤسسات (enterprise). لذلك تحوّل المشروع إلى [Duffel](https://duffel.com) — واجهة برمجية واحدة للطيران (+300 شركة طيران) والفنادق (Duffel Stays، أكثر من 2 مليون عقار)، بتسجيل ذاتي فوري بدون مكالمة مبيعات.
>
> **Note:** This project previously used Amadeus for Developers, but Amadeus fully decommissioned its self-service portal on July 17, 2026 (it's now enterprise/sales-only). The project now uses [Duffel](https://duffel.com) instead — a single API for both flights (300+ airlines) and hotels (Duffel Stays, 2M+ properties), with instant self-serve signup and no sales call required.

يستخدم الموقع الآن [Duffel](https://duffel.com) — تسعير حسب الاستخدام (pay-as-you-go) بدون رسوم شهرية: عمليات البحث مجانية، وتُفرض رسوم صغيرة فقط عند إتمام حجز فعلي (٣$ + ١٪ من قيمة الحجز تقريباً).

The site now uses [Duffel](https://duffel.com) — pay-as-you-go with no monthly fee: searches are free, and small fees only apply when a booking is actually confirmed (~$3 + 1% of order value).

خطوات التفعيل / To activate:
1. أنشئ حساباً مجانياً على duffel.com (تسجيل ذاتي فوري، بدون مكالمة مبيعات).
2. من لوحة التحكم: Developers → Access tokens → أنشئ مفتاح اختبار (يبدأ بـ `duffel_test_`) لتجربة بيانات حقيقية بدون أي مخاطرة مالية، أو مفتاح مباشر (`duffel_live_`) عند الجاهزية لاستقبال حجوزات فعلية.
3. أضف المفتاح إلى `.env.local`:
   ```
   DUFFEL_API_KEY=...
   ```
4. أعد تشغيل الموقع — سيتحول تلقائياً من البيانات التجريبية إلى بيانات Duffel الحقيقية.

### ب) روابط مقارنة وعمولة (affiliate) لبقية المصادر / Comparison & affiliate links for the rest

بما أن Booking.com وWego وسكاي سكانر والمسافر وflynas لا تسمح بجلب بيانات أسعارها الحية بدون شراكة رسمية، يعرض الموقع لكل عملية بحث **روابط مقارنة مباشرة** لهذه المواقع (`src/lib/affiliateLinks.ts`) بحيث يكمل المستخدم حجزه هناك، وأنت تربح عمولة إحالة بعد التسجيل في برامج الشراكة الخاصة بكل موقع:

| المصدر | نوع الوصول | رابط التسجيل |
|---|---|---|
| Booking.com | برنامج شراكة عام، تسجيل فوري، عمولة على كل حجز | https://www.booking.com/affiliate-program/v2/index.html |
| Wego | يتطلب طلب شراكة API (تقييم واعتماد) | https://developers.wego.com/docs/affiliate/get-started/ |
| Skyscanner | يتطلب طلب شراكة Travel API (تقييم واعتماد) | https://www.partners.skyscanner.net/product/travel-api |
| Almosafer (المسافر) | تواصل مع فريق تطوير الأعمال لدى مجموعة سيرا | (تواصل مباشر) |
| flynas / flyadeal / السعودية | لا يوجد API عام موثق؛ روابط حجز مباشرة فقط | (روابط الحجز على الموقع الرسمي) |

بعد الموافقة على أي برنامج، أضف معرّف الشراكة في `.env.local` (مثال: `BOOKING_AFFILIATE_ID=...`) وستُستخدم تلقائياً في الروابط.

### ج) الخطة السياحية بالذكاء الاصطناعي / AI itinerary

يستخدم الموقع Claude (Anthropic API) لتوليد خطط سياحية حقيقية ومخصصة، مع تفعيل أداة البحث الحي في الإنترنت (web search) بحيث يعتمد الذكاء الاصطناعي على مصادر موثوقة وحديثة مثل TripAdvisor والمواقع الرسمية للسياحة بدلاً من الاعتماد فقط على معرفته المُدرَّب عليها مسبقاً. للتفعيل:
1. أنشئ مفتاحاً على https://platform.claude.com/ (Settings → API Keys).
2. أضفه إلى `.env.local`:
   ```
   ANTHROPIC_API_KEY=...
   ANTHROPIC_MODEL=claude-sonnet-4-5
   ```
بدون هذا المفتاح، يعرض الموقع خطة نموذجية (Demo) بدلاً من ذلك. ملاحظة: البحث الحي مدفوع بشكل منفصل (~10$ لكل 1000 عملية بحث) بالإضافة إلى تكلفة استخدام النموذج نفسه.

---

## 3. النشر / Deployment

المشروع جاهز للنشر على منصتين — اختر ما يناسبك:

### الخيار أ) Cloudflare Workers (مجاني تماماً، ويسمح بالاستخدام التجاري) — موصى به

خطة Cloudflare المجانية تسمح صراحة بالمواقع التجارية وروابط الإحالة، على عكس خطة Vercel المجانية. المشروع مُجهّز مسبقاً بملفات الإعداد اللازمة (`wrangler.jsonc`, `open-next.config.ts`) عبر [OpenNext](https://opennext.js.org/cloudflare).

```bash
npm install
npx wrangler login          # يفتح المتصفح لتسجيل الدخول بحساب Cloudflare مجاني
npm run cf:deploy           # يبني وينشر الموقع مباشرة
```

بعد أول نشر، أضف المفاتيح السرية (بدلاً من وضعها في ملف عادي):
```bash
npx wrangler secret put DUFFEL_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
```

أو بدون أي سطر أوامر: اربط مستودع GitHub بحسابك في لوحة تحكم Cloudflare (Workers & Pages → Create → Connect to Git) وسيُبنى وينشر تلقائياً مع كل تحديث للكود.

### الخيار ب) Vercel (بديل احترافي، يتطلب خطة Pro بـ 20$/شهرياً للمشاريع التجارية)

```bash
npm install -g vercel
vercel
```

خطة Vercel المجانية (Hobby) مخصصة للمشاريع الشخصية غير التجارية فقط، وتستثني صراحة "المواقع التي تعتمد على روابط الإحالة (Affiliate) كغرض أساسي" — وهذا وصف iTravel. لذلك يتطلب النشر التجاري عليها خطة Pro.

---

The project is deploy-ready on two platforms:

- **Cloudflare Workers (free, commercial-use allowed)** — recommended. Already configured via OpenNext (`wrangler.jsonc`, `open-next.config.ts`). Run `npx wrangler login` then `npm run cf:deploy`, or connect the GitHub repo in the Cloudflare dashboard for automatic deploys on push.
- **Vercel** — also supported, but its free Hobby plan explicitly excludes commercial/affiliate-driven sites, so a live commercial deployment there requires the $20/month Pro plan.

---

## 4. بنية المشروع / Project structure

```
src/
  app/
    [locale]/           # كل الصفحات مضاعفة للغتين ar/en عبر segment ديناميكي
      page.tsx           # الصفحة الرئيسية + نموذج البحث
      results/page.tsx   # نتائج الطيران/الفنادق ومطابقة الميزانية
      itinerary/page.tsx # مولّد الخطة السياحية بالذكاء الاصطناعي
    api/
      flights/route.ts   # يستدعي Duffel (أو بيانات تجريبية) لعروض الطيران
      hotels/route.ts    # يستدعي Duffel (أو بيانات تجريبية) لعروض الفنادق
      itinerary/route.ts # يستدعي Claude (أو خطة نموذجية) لتوليد الخطة
  components/            # عناصر واجهة قابلة لإعادة الاستخدام
  lib/
    flights.ts           # عميل Duffel + توليد بيانات تجريبية واقعية
    affiliateLinks.ts     # روابط المقارنة/الإحالة لكل مصدر
    combine.ts            # منطق مطابقة تركيبات طيران+فندق مع الميزانية
    itinerary.ts           # استدعاء Claude لتوليد الخطة السياحية
    dictionaries.ts        # نصوص الواجهة بالعربي والإنجليزي
```

---

## 5. ملاحظات مهمة قبل الإطلاق التجاري / Important notes before commercial launch

- **الأسعار المعروضة تقديرية.** يجب دائماً توجيه المستخدم لإتمام الحجز الفعلي عبر شريك الحجز (Booking.com، الخط الجوي، إلخ) للحصول على السعر والتوافر النهائي.
- **راجع "خطة العمل" (`iTravel-Business-Plan.docx`)** المرفقة للحصول على خارطة طريق الشراكات، التكاليف، المخاطر، والخطوات القانونية والتجارية في السعودية.
- تأكد من وجود سياسة خصوصية وشروط استخدام واضحة قبل جمع بيانات المستخدمين الفعليين.
- Prices shown are estimates. Always route the user to the actual booking partner to confirm final price and availability.
- See the attached business plan document for the partnership roadmap, costs, risks, and legal/commercial steps in Saudi Arabia.
- Add a real privacy policy and terms of use before collecting real user data.
