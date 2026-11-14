import Anthropic from "@anthropic-ai/sdk";
import { COMPANION_SYSTEM_PROMPT, CRISIS_NOTE, languageNote } from "./prompt";

export const COMPANION_MODEL = "claude-opus-5-5";

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * Streams the companion's reply as plain text chunks.
 * `onDone` receives the full reply (used to persist it when the user keeps history).
 */
export function streamCompanionReply({
  history,
  localeName,
  supportLines,
  crisis,
  onDone,
}: {
  history: ChatTurn[];
  localeName: string;
  /** Per-country helplines (see supportNote in lib/helplines). */
  supportLines: string;
  crisis: boolean;
  onDone?: (text: string) => Promise<void> | void;
}) {
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((t) => ({ role: t.role, content: t.content }));
  // Mid-conversation operator note: keeps the cached prefix intact.
  if (crisis) messages.push({ role: "system", content: CRISIS_NOTE } as unknown as Anthropic.Beta.BetaMessageParam);

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let text = "";
      try {
        const stream = getClient().beta.messages.stream({
          model: COMPANION_MODEL,
          max_tokens: 8000,
          output_config: { effort: "medium" },
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: [
            { type: "text", text: COMPANION_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
            // Per-user details go after the cached prompt so the cache stays valid.
            { type: "text", text: `${languageNote(localeName)}\n${supportLines}` },
          ],
          messages,
        });

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            text += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal" && !text.trim()) {
          text = "\u0000refusal";
        }
        if (final.stop_reason === "max_tokens" && !text.trim()) text = "\u0000error";
        if (text.startsWith("\u0000")) controller.enqueue(encoder.encode(text));
        await onDone?.(text);
      } catch (err) {
        // Never log message content; only the error class.
        console.error("ai_error", err instanceof Error ? err.name : "unknown");
        // Missing/invalid credentials (config errors aren't APIErrors) → "unavailable"; anything else → "error".
        const unavailable =
          err instanceof Anthropic.AuthenticationError ||
          (err instanceof Anthropic.AnthropicError && !(err instanceof Anthropic.APIError));
        controller.enqueue(encoder.encode(unavailable ? "\u0000unavailable" : "\u0000error"));
      } finally {
        controller.close();
      }
    },
  });
}
