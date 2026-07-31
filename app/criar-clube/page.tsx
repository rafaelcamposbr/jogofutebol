import { redirect } from "next/navigation";
import { BetaBadge } from "@/components/BetaBadge";
import { CreateClubForm } from "@/components/CreateClubForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CreateClubPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <main className="plain-page">
        <section className="plain-card">
          <BetaBadge />
          <h1>Criar clube</h1>
          <p>Configure o Supabase para criar clubes reais. Enquanto isso, o modo visitante continua disponivel.</p>
          <div className="link-row">
            <a href="/experimentar">Experimentar o jogo</a>
            <a href="/status">Ver status</a>
          </div>
        </section>
      </main>
    );
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login?next=/criar-clube");

  const { data: existingClub } = await supabase.from("clubs").select("id").eq("owner_id", userData.user.id).maybeSingle();
  if (existingClub) redirect("/central");

  return (
    <main className="plain-page">
      <section className="plain-card">
        <BetaBadge />
        <h1>Criar clube</h1>
        <p>
          A fundacao usa o horario do servidor, caixa inicial R$ 0, reputacao institucional 1,00,
          financeira 1,00 e esportiva 0,50.
        </p>
        <CreateClubForm />
      </section>
    </main>
  );
}
