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
  const prompt = `You are a professional travel planner with access to real-time web search. Before writing anything, use the web_search tool to research ${req.destination}: top attractions, current opening hours/prices where relevant, and traveler-vetted recommendations. Run at least 2-3 searches. Prioritize trustworthy, up-to-date sources such as TripAdvisor (tripadvisor.com), official tourism board sites, and well-known travel guides — do not rely only on prior knowledge.

Once your research is done, create a detailed, realistic day-by-day itinerary grounded in what you found.
Destination: ${req.destination}
Trip length: ${req.days} days
${req.budget ? `Approximate total budget (excluding flights/hotel): ${req.budget} ${req.currency ?? ""}` : ""}
${req.interests ? `Traveler interests: ${req.interests}` : ""}
${langInstruction}

After finishing your research, your FINAL reply must contain ONLY valid JSON (no markdown fences, no extra commentary, no citations markup) matching exactly this TypeScript type:
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
        max_tokens: 8000,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 5,
          },
        ],
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
    const data = await res.json();

    // The web_search tool is executed server-side by Anthropic within this
    // single request/response, so `content` is an array that can interleave
    // text blocks with server_tool_use / web_search_tool_result blocks.
    // We only care about the text blocks, and specifically the final one,
    // which per the prompt should be pure JSON.
    const textBlocks = (data.content ?? []).filter(
      (b: { type: string }) => b.type === "text"
    ) as Array<{ type: "text"; text: string }>;
    if (!textBlocks.length) throw new Error("No text content in AI response");
    const lastText = textBlocks[textBlocks.length - 1].text;

    const jsonMatch = lastText.match(/\{[\s\S]*\}/);
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
