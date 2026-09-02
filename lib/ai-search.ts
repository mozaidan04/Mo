import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import { searchFatwasText } from "./data";
import { truncate } from "./arabic";
import type { SearchHit, SearchResponse } from "./types";

const MODEL = "claude-opus-5";
const CANDIDATE_LIMIT = 30;
const RESULT_LIMIT = 10;

const RankingSchema = z.object({
  summary: z
    .string()
    .describe("ملخص عربي قصير (2-4 جمل) يشرح ما تتناوله الفتاوى المختارة، أو اعتذار إن لم توجد فتوى مناسبة."),
  results: z
    .array(
      z.object({
        number: z.number().describe("رقم الفتوى كما ورد في القائمة"),
        reason: z.string().describe("سطر واحد يوضح صلة الفتوى بالسؤال"),
      }),
    )
    .describe("الفتاوى المرتبطة بالسؤال مرتبة من الأقوى صلة إلى الأقل، وقائمة فارغة إن لم توجد صلة."),
});

const SYSTEM_PROMPT = `أنت مساعد بحث داخل مكتبة فتاوى الشيخ مصطفى العدوي.

مهمتك: قراءة سؤال الزائر وقائمة الفتاوى المرشّحة، ثم اختيار الفتاوى المرتبطة بسؤاله وترتيبها.

قواعد ملزمة:
- لا تُفتِ من عندك، ولا تضف حكمًا شرعيًا غير موجود في الفتاوى المعروضة عليك.
- الملخص يكون وصفًا لما ورد في الفتاوى المختارة فقط، ولا يزيد عليها.
- لا تذكر رقم فتوى غير موجود في القائمة المعطاة لك.
- إذا لم تجد في القائمة ما يتعلق بالسؤال فأعد قائمة نتائج فارغة، واذكر في الملخص أنه لا توجد فتوى مطابقة في المكتبة.
- اكتب بالعربية الفصحى الواضحة والموجزة.`;

function client(): Anthropic {
  return new Anthropic({ timeout: 60_000, maxRetries: 1 });
}

export function isAiSearchEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * البحث في الفتاوى: استرجاع نصي أولًا، ثم إعادة ترتيب بالذكاء الاصطناعي
 * وتلخيص للنتائج. عند غياب مفتاح Claude أو تعذّر الاتصال يعود البحث النصي وحده.
 */
export async function searchFatwas(query: string): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) return { query: trimmed, summary: null, hits: [], mode: "text" };

  const candidates = await searchFatwasText(trimmed, CANDIDATE_LIMIT);
  const textHits: SearchHit[] = candidates
    .slice(0, RESULT_LIMIT)
    .map(({ score, ...fatwa }) => ({ fatwa, score }));

  if (!isAiSearchEnabled()) {
    return {
      query: trimmed,
      summary: null,
      hits: textHits,
      mode: "text",
      notice: "البحث الذكي غير مفعّل — أضف مفتاح ANTHROPIC_API_KEY لتفعيله. النتائج المعروضة بالمطابقة النصية.",
    };
  }

  if (candidates.length === 0) {
    return { query: trimmed, summary: null, hits: [], mode: "text" };
  }

  const catalogue = candidates
    .map((f) =>
      [
        `### فتوى رقم ${f.number}`,
        `العنوان: ${f.title}`,
        `التصنيف: ${f.category_name ?? "غير مصنّفة"}`,
        `السؤال: ${truncate(f.question, 400)}`,
        `الإجابة: ${truncate(f.answer, 700)}`,
      ].join("\n"),
    )
    .join("\n\n");

  try {
    const message = await client().beta.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: betaZodOutputFormat(RankingSchema),
      },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `سؤال الزائر:\n${trimmed}\n\nالفتاوى المرشّحة:\n\n${catalogue}`,
        },
      ],
    });

    if (message.stop_reason === "refusal" || !message.parsed_output) {
      return { query: trimmed, summary: null, hits: textHits, mode: "text" };
    }

    const byNumber = new Map(candidates.map((f) => [f.number, f]));
    const hits: SearchHit[] = [];
    for (const [i, item] of message.parsed_output.results.entries()) {
      const fatwa = byNumber.get(item.number);
      if (!fatwa || hits.some((h) => h.fatwa.number === item.number)) continue;
      const { score, ...rest } = fatwa;
      void score;
      hits.push({ fatwa: rest, reason: item.reason, score: 1 - i * 0.05 });
      if (hits.length >= RESULT_LIMIT) break;
    }

    return {
      query: trimmed,
      summary: message.parsed_output.summary || null,
      hits: hits.length > 0 ? hits : textHits,
      mode: hits.length > 0 ? "ai" : "text",
    };
  } catch (error) {
    console.error("[ai-search] تعذّر البحث الذكي، تم الرجوع إلى البحث النصي:", error);
    return {
      query: trimmed,
      summary: null,
      hits: textHits,
      mode: "text",
      notice: "تعذّر تشغيل البحث الذكي الآن، وهذه نتائج البحث النصي.",
    };
  }
}
