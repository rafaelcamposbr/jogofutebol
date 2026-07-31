import { NextRequest, NextResponse } from "next/server";
import { isProblemReportingEnabled } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const categories = new Set(["Bug", "Interface", "Regra do jogo", "Desempenho", "Sugestao", "Outro"]);

export async function POST(request: NextRequest) {
  if (!isProblemReportingEnabled()) {
    return NextResponse.json({ error: "Recurso indisponivel." }, { status: 404 });
  }

  const payload = await request.json().catch(() => null);
  const title = String(payload?.title || "").trim().slice(0, 120);
  const description = String(payload?.description || "").trim().slice(0, 1200);
  const category = categories.has(payload?.category) ? payload.category : "Outro";
  const pageUrl = String(payload?.page_url || "").slice(0, 500);
  const browser = String(payload?.browser || "").slice(0, 500);

  if (!title || !description) {
    return NextResponse.json({ error: "Titulo e descricao sao obrigatorios." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id || null;
  let clubId: string | null = null;

  if (userId) {
    const { data: club } = await supabase.from("clubs").select("id").eq("owner_id", userId).maybeSingle();
    clubId = club?.id || null;
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: userId,
    club_id: clubId,
    category,
    title,
    description,
    page_url: pageUrl,
    browser,
    status: "open",
  });

  if (error) return NextResponse.json({ error: "Falha ao registrar feedback." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
