import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const statuses: Record<string, string> = {
  draft: "draft",
  scheduled: "scheduled",
  published: "published",
  withdrawn: "removed",
  removed: "removed",
};

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const title = String(payload?.title || "").trim().slice(0, 120);
  const content = String(payload?.text || payload?.content || "").trim().slice(0, 1200);
  const category = String(payload?.category || "Nota oficial").trim().slice(0, 80);
  const status = statuses[String(payload?.status || "draft")] || "draft";

  if (!title || !content) {
    return NextResponse.json({ error: "Titulo e conteudo sao obrigatorios." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: "Sessao expirada." }, { status: 401 });

  const { data: club } = await supabase.from("clubs").select("id").eq("owner_id", user.id).maybeSingle();
  if (!club) return NextResponse.json({ error: "Usuario sem clube." }, { status: 409 });

  const publishAt = payload?.publishAt ? new Date(payload.publishAt).toISOString() : null;
  const { error } = await supabase.from("press_releases").insert({
    club_id: club.id,
    author_id: user.id,
    title,
    content,
    category,
    status,
    published_at: status === "published" ? publishAt || new Date().toISOString() : null,
    scheduled_at: status === "scheduled" ? publishAt : null,
    institutional_impact: Number(payload?.impact?.institutional || 0),
    financial_impact: Number(payload?.impact?.financial || 0),
    sporting_impact: Number(payload?.impact?.sporting || 0),
  });

  if (error) return NextResponse.json({ error: "Falha ao salvar comunicado." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
