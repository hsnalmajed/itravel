import type { ItineraryResult, Locale } from "./types";

interface ItineraryRequest {
  destination: string;
  days: number;
  budget?: number;
  currency?: string;
  interests?: string;
  locale: Locale;
}

function buildMockItinerary(req: ItineraryRequest): ItineraryResult {
  const themes = req.locale === "ar"
    ? ["استكشاف وسط المدينة", "معالم تاريخية وثقافية", "طبيعة ومساحات مفتوحة", "تسوق وأسواق محلية", "تجربة طعام محلي", "يوم استرخاء", "رحلة خارج المدينة"]
    : ["Downtown exploration", "Historic & cultural sites", "Nature & outdoors", "Local markets & shopping", "Local food experience", "Relaxed day", "Day trip outside the city"];

  const plan = Array.from({ length: req.days }, (_, i) => {
    const theme = themes[i % themes.length];
    return {
      day: i + 1,
      title: req.locale === "ar" ? `اليوم ${i + 1}: ${theme}` : `Day ${i + 1}: ${theme}`,
      activities:
        req.locale === "ar"
          ? [
              "فطور محلي وبداية هادئة لليوم",
              `زيارة أبرز معالم "${theme}" في ${req.destination}`,
              "وقت حر للتصوير والاستكشاف",
              "عشاء في مطعم موصى به محلياً",
            ]
          : [
              "Local breakfast and a relaxed start",
              `Visit key spots related to "${theme}" in ${req.destination}`,
              "Free time for photos and exploring",
              "Dinner at a locally recommended restaurant",
            ],
      estimatedCost: req.budget ? `${Math.round((req.budget / req.days) * 0.6)} ${req.currency ?? ""}`.trim() : undefined,
    };
  });

  return {
    destination: req.destination,
    days: req.days,
    summary:
      req.locale === "ar"
        ? `خطة تجريبية لمدة ${req.days} أيام في ${req.destination}. فعّل مفتاح الذكاء الاصطناعي للحصول على خطة مخصصة فعلياً.`
        : `Sample ${req.days}-day plan for ${req.destination}. Enable the AI key to generate a truly personalized plan.`,
    plan,
    tips:
      req.locale === "ar"
        ? ["احجز التذاكر للمعالم المزدحمة مسبقاً", "احمل نسخة رقمية من جواز السفر والحجوزات", "تحقق من متطلبات التأشيرة قبل السفر"]
        : ["Book tickets for busy attractions in advance", "Keep digital copies of your passport and bookings", "Check visa requirements before you travel"],
    isMock: true,
  };
}

export async function generateItinerary(req: ItineraryRequest): Promise<ItineraryResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return buildMockItinerary(req);
  }

  const langInstruction = req.locale === "ar" ? "اكتب الخطة باللغة العربية." : "Write the plan in English.";
  const prompt = `You are a professional travel planner. Create a detailed day-by-day itinerary.
Destination: ${req.destination}
Trip length: ${req.days} days
${req.budget ? `Approximate total budget (excluding flights/hotel): ${req.budget} ${req.currency ?? ""}` : ""}
${req.interests ? `Traveler interests: ${req.interests}` : ""}
${langInstruction}

Respond ONLY with valid JSON matching exactly this TypeScript type, no markdown fences, no extra text:
{
  "summary": string,
  "plan": [{ "day": number, "title": string, "activities": string[], "estimatedCost": string }],
  "tips": string[]
}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      destination: req.destination,
      days: req.days,
      summary: parsed.summary,
      plan: parsed.plan,
      tips: parsed.tips,
      isMock: false,
    };
  } catch (err) {
    console.error("Falling back to mock itinerary:", err);
    return buildMockItinerary(req);
  }
}
