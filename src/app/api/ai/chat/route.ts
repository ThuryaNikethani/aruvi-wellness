import { z } from "zod";
import { MessageRole } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { ApiError, handle, parseJson, requireUserId } from "@/lib/api";
import { rateLimit } from "@/lib/security/rate-limit";
import { detectCrisis } from "@/lib/ai/safety";
import { streamCompanionReply } from "@/lib/ai/companion";
import { nativeName } from "@/i18n/locales";
import { guessCountry, supportNote } from "@/lib/helplines";

const turn = z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) });

const chatSchema = z.object({
  conversationId: z.string().cuid().optional(),
  locale: z.string().min(2).max(10).default("en"),
  country: z.string().regex(/^([A-Za-z]{2}|OTHER)$/).optional(),
  history: z.array(turn).max(30).default([]),
  message: z.string().trim().min(1).max(4000),
});

/**
 * POST a message; the reply streams back as plain text.
 * Headers: X-Aruvi-Crisis (1 when the safety screen matched), X-Conversation-Id (when saved).
 * Stream sentinels starting with \u0000 signal "refusal", "unavailable" or "error".
 */
export const POST = handle(async (req) => {
  const userId = await requireUserId();
  // Free-tier cost control: per-user hourly cap on top of the per-IP limit.
  const hourly = rateLimit(`ai:${userId}`, 40, 60 * 60_000);
  if (!hourly.ok) throw new ApiError(429, "rate_limited");

  const { conversationId, locale, country, history, message } = await parseJson(req, chatSchema);
  const helplineCountry = (country ?? guessCountry(locale, req.headers.get("x-vercel-ip-country"))).toUpperCase();
  const crisis = detectCrisis(message);

  const prefs = await prisma.userPreferences.findUnique({ where: { userId }, select: { keepAiHistory: true } });
  const keep = prefs?.keepAiHistory ?? false;

  let convoId: string | undefined;
  let turns = [...history.slice(-20), { role: "user" as const, content: message }];

  if (keep) {
    const existing = conversationId
      ? await prisma.conversation.findFirst({ where: { id: conversationId, userId }, select: { id: true } })
      : null;
    const convo =
      existing ?? (await prisma.conversation.create({ data: { userId, locale, title: message.slice(0, 60) }, select: { id: true } }));
    convoId = convo.id;
    // When history is stored, the server's copy is the source of truth.
    const stored = await prisma.message.findMany({
      where: { conversationId: convo.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { role: true, content: true },
    });
    turns = [
      ...stored.reverse().map((m) => ({ role: m.role === MessageRole.USER ? ("user" as const) : ("assistant" as const), content: m.content })),
      { role: "user" as const, content: message },
    ];
    await prisma.message.create({
      data: { conversationId: convo.id, role: MessageRole.USER, content: message, flaggedCrisis: crisis },
    });
  }

  const stream = streamCompanionReply({
    history: turns,
    localeName: nativeName(locale),
    supportLines: supportNote(helplineCountry, locale),
    crisis,
    onDone: async (text) => {
      if (!convoId || !text || text.startsWith("\u0000")) return;
      await prisma.message.create({ data: { conversationId: convoId, role: MessageRole.ASSISTANT, content: text } });
      await prisma.conversation.update({ where: { id: convoId }, data: { updatedAt: new Date() } });
    },
  });

  const headers: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Aruvi-Crisis": crisis ? "1" : "0",
  };
  if (convoId) headers["X-Conversation-Id"] = convoId;
  return new Response(stream, { headers });
}, { limit: 20 });
