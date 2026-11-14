import { prisma } from "@/lib/database/prisma";
import { ApiError, handle, json, parseJson, requireUserId, type IdParams } from "@/lib/api";
import { journalUpdateSchema } from "@/lib/validation/schemas";

export const GET = handle(async (_req, { params }: IdParams) => {
  const userId = await requireUserId();
  const { id } = await params;
  const entry = await prisma.journalEntry.findFirst({ where: { id, userId } });
  if (!entry) throw new ApiError(404, "not_found");
  return json({ entry });
});

export const PATCH = handle(async (req, { params }: IdParams) => {
  const userId = await requireUserId();
  const { id } = await params;
  const data = await parseJson(req, journalUpdateSchema);
  const { count } = await prisma.journalEntry.updateMany({ where: { id, userId }, data });
  if (!count) throw new ApiError(404, "not_found");
  return json({ ok: true });
});

export const DELETE = handle(async (_req, { params }: IdParams) => {
  const userId = await requireUserId();
  const { id } = await params;
  const { count } = await prisma.journalEntry.deleteMany({ where: { id, userId } });
  if (!count) throw new ApiError(404, "not_found");
  return json({ ok: true });
});
