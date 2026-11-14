import { handle, json, parseQuery, requireUserId } from "@/lib/api";
import { loadInsights } from "@/lib/insights";
import { rangeQuerySchema } from "@/lib/validation/schemas";

export const GET = handle(async (req) => {
  const userId = await requireUserId();
  const { days } = parseQuery(req, rangeQuerySchema);
  return json({ insights: await loadInsights(userId, days) });
});
