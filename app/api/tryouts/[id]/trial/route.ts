import { apiError, apiSuccess } from "@/lib/auth/api";
import { startTrial } from "@/lib/game/scouting/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await params;
  const body = await request.json().catch(() => null) as { candidateId?: string } | null;
  if (!body?.candidateId) return apiError("Candidato invalido.", 422);
  const result = await startTrial(body.candidateId);
  if (!result.ok) return result.error;
  return apiSuccess({ contractId: result.contractId });
}
