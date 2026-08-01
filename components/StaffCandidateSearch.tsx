"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatBRL } from "@/lib/money";

type Group = { id: string; label: string };
type Role = { id: string; label: string; groupId: string };
type Candidate = {
  id: string; name: string; groupLabel: string; roleLabel: string; subgroup: string; relevance: number;
  aptitude: number; experience: number; suggestedSalary: number; salaryMin: number; salaryMax: number; city: string;
};

export function StaffCandidateSearch({ groups, roles, initialGroup = "", initialRole = "" }: { groups: readonly Group[]; roles: readonly Role[]; initialGroup?: string; initialRole?: string }) {
  const router = useRouter();
  const [group, setGroup] = useState(initialGroup);
  const [role, setRole] = useState(initialRole);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const visibleRoles = useMemo(() => roles.filter((item) => item.groupId === group), [group, roles]);

  useEffect(() => {
    if (!group) { setCandidates([]); setMessage(""); return; }
    const params = new URLSearchParams({ group });
    if (role) params.set("role", role);
    router.replace(`/escritorio/funcionarios/busca?${params}`, { scroll: false });
    const controller = new AbortController();
    setLoading(true); setMessage("");
    fetch(`/api/staff/candidates?${params}`, { signal: controller.signal })
      .then(async (response) => ({ response, body: await response.json() }))
      .then(({ response, body }) => {
        if (!response.ok) { setCandidates([]); setMessage(body.message || "Nao foi possivel pesquisar."); return; }
        setCandidates(body.candidates || []);
      })
      .catch((error) => { if (error.name !== "AbortError") setMessage("Nao foi possivel pesquisar agora."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [group, role, router]);

  function changeGroup(value: string) {
    setGroup(value);
    if (!roles.some((item) => item.id === role && item.groupId === value)) setRole("");
    if (!value) router.replace("/escritorio/funcionarios/busca", { scroll: false });
  }

  return (
    <div className="staff-search-workspace">
      <form className="staff-search-filters" onSubmit={(event) => event.preventDefault()}>
        <label>Grupo<select value={group} onChange={(event) => changeGroup(event.target.value)}><option value="">Selecione um grupo</option>{groups.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Funcao<select value={role} disabled={!group} onChange={(event) => setRole(event.target.value)}><option value="">Todas as funcoes deste grupo</option>{visibleRoles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      </form>
      {loading ? <p className="empty-state" role="status">Pesquisando profissionais...</p> : null}
      {message ? <p className="form-result error" role="alert">{message}</p> : null}
      {!group && !loading ? <p className="empty-state">Selecione um grupo para consultar os profissionais disponiveis.</p> : null}
      {group && !loading && !message && !candidates.length ? <p className="empty-state">Nenhum candidato encontrado para estes filtros.</p> : null}
      {candidates.length ? <div className="staff-candidate-list">{candidates.map((item) => <article className="staff-candidate" key={item.id}>
        <div><span>{item.groupLabel} / {item.subgroup}</span><h2>{item.name}</h2><p>{item.roleLabel} - {item.city}</p></div>
        <dl><div><dt>Aptidao observada</dt><dd>{item.aptitude}/100</dd></div><div><dt>Experiencia</dt><dd>{item.experience} anos</dd></div><div><dt>Relevancia</dt><dd>{item.relevance}/5</dd></div><div><dt>Faixa salarial</dt><dd>{formatBRL(item.salaryMin)} a {formatBRL(item.salaryMax)}</dd></div><div><dt>Sugestao</dt><dd>{formatBRL(item.suggestedSalary)}</dd></div></dl>
        <Link className="primary-link" href="/escritorio/funcionarios/contratacoes">Abrir negociacoes</Link>
      </article>)}</div> : null}
    </div>
  );
}
