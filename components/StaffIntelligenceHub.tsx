"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { COURSE_CATALOG } from "@/lib/staff/engine";

type Employee = {
  id: string;
  legacy_id: string;
  name: string;
  role_id: string;
  role_label: string;
  role_group: string;
  status: string;
  salary: number;
  aptitudes: Record<string, number>;
  autonomy_level: number;
  personalityEvidence: number;
  coreConceptCount: number;
  personality: Array<{ concept: string | null; label: string; confidence: string }>;
  statusMetrics: {
    satisfaction: number;
    satisfactionLabel: string;
    trust: number;
    morale: number;
    workload: number;
    meetingFatigue: number;
    trainingFatigue: number;
  } | null;
  memories: Array<{ summary: string; memory_type: string; created_at: string }>;
};

type Overview = {
  club: { id: string; name: string; cash_balance: number };
  employees: Employee[];
  courses: Array<Record<string, unknown>>;
  meetings: Array<Record<string, unknown>>;
  meetingResults: Array<Record<string, unknown>>;
  promises: Array<Record<string, unknown>>;
  advisors: Array<Record<string, unknown>>;
  tutorial: Record<string, unknown> | null;
};

type TutorialData = {
  progress: { current_step: number; completed_steps: number[]; contextual_tips_seen: string[]; status: string } | null;
  advisor: { name: string; role: string; subtitle: string; initials: string };
  steps: Array<{ id: number; title: string; target: string }>;
};

type Tab = "team" | "meetings" | "courses" | "advisors" | "tutorial";
const tabs: Array<{ id: Tab; label: string }> = [
  { id: "team", label: "Equipe" },
  { id: "meetings", label: "Reunioes" },
  { id: "courses", label: "Cursos" },
  { id: "advisors", label: "Orientacoes" },
  { id: "tutorial", label: "Tutorial" },
];

export function StaffIntelligenceHub({ clubId }: { clubId: string }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [tutorial, setTutorial] = useState<TutorialData | null>(null);
  const [tab, setTab] = useState<Tab>("team");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [meetingResult, setMeetingResult] = useState<Record<string, unknown> | null>(null);
  const [advisorFilter, setAdvisorFilter] = useState("new");

  const load = useCallback(async () => {
    const [overviewResponse, tutorialResponse] = await Promise.all([
      fetch("/api/staff/overview", { cache: "no-store" }),
      fetch("/api/tutorial", { cache: "no-store" }),
    ]);
    if (overviewResponse.ok) {
      const next = await overviewResponse.json() as Overview;
      setOverview(next);
      setSelectedEmployeeId((current) => current || next.employees[0]?.id || "");
    }
    if (tutorialResponse.ok) setTutorial(await tutorialResponse.json());
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const initialTab = query.get("tab") as Tab | null;
    if (tabs.some((item) => item.id === initialTab)) setTab(initialTab!);
    const requestedEmployee = query.get("employee");
    if (requestedEmployee) setSelectedEmployeeId(requestedEmployee);
    void (async () => {
      try {
        const raw = window.localStorage.getItem("football-club-manager-prototype-v1");
        const state = raw ? JSON.parse(raw) : null;
        if (state?.club?.supabaseClubId === clubId && Array.isArray(state?.staff?.employees)) {
          await fetch("/api/staff/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ employees: state.staff.employees }),
          });
        }
      } catch { /* The persistent snapshot still loads when legacy storage is unavailable. */ }
      await load();
    })();
  }, [clubId, load]);

  const selectedEmployee = overview?.employees.find((employee) => employee.id === selectedEmployeeId) || overview?.employees[0] || null;
  const averages = useMemo(() => {
    const values = (overview?.employees || []).map((employee) => employee.statusMetrics).filter(Boolean);
    if (!values.length) return { satisfaction: 0, trust: 0 };
    return {
      satisfaction: Math.round(values.reduce((sum, item) => sum + item!.satisfaction, 0) / values.length),
      trust: Math.round(values.reduce((sum, item) => sum + item!.trust, 0) / values.length),
    };
  }, [overview]);

  async function submitMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEmployee) return;
    setBusy(true); setMessage(""); setMeetingResult(null);
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/staff/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: selectedEmployee.id,
        subject: values.subject,
        text: values.text,
        collective: values.collective === "on",
        aptitudeTarget: values.aptitudeTarget,
      }),
    });
    const payload = await response.json();
    setMessage(payload.message || (response.ok ? "Reuniao concluida e registrada." : "Nao foi possivel concluir a reuniao."));
    if (response.ok) { setMeetingResult(payload); await load(); event.currentTarget.reset(); }
    setBusy(false);
  }

  async function submitCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEmployee) return;
    setBusy(true); setMessage("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/staff/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: selectedEmployee.id,
        courseType: values.courseType,
        domain: values.domain,
        subject: values.subject,
        level: values.level,
        aptitudeTarget: values.aptitudeTarget,
        selectedByEmployee: values.selectedByEmployee === "on",
        forced: values.forced === "on",
      }),
    });
    const payload = await response.json();
    setMessage(payload.message || (response.ok ? "Curso registrado." : "Nao foi possivel iniciar o curso."));
    if (response.ok) { await load(); event.currentTarget.reset(); }
    setBusy(false);
  }

  async function patch(path: string, payload: Record<string, unknown>) {
    setBusy(true); setMessage("");
    const response = await fetch(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    setMessage(result.message || (response.ok ? "Alteracao registrada." : "Nao foi possivel concluir a acao."));
    if (response.ok) await load();
    setBusy(false);
  }

  function chooseTab(next: Tab) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState({}, "", url);
  }

  if (!overview) return <div className="people-loading" role="status">Carregando Central de Pessoas...</div>;
  return (
    <div className="people-hub">
      <header className="people-heading">
        <div>
          <span className="people-kicker">{overview.club.name}</span>
          <h1>Central de Pessoas</h1>
        </div>
        <a className="people-back" href="/escritorio/funcionarios">Voltar ao Escritorio</a>
      </header>

      <section className="people-metrics" aria-label="Resumo da equipe">
        <div><span>Funcionarios</span><strong>{overview.employees.filter((item) => item.status === "active").length}</strong></div>
        <div><span>Satisfacao media</span><strong>{averages.satisfaction}</strong></div>
        <div><span>Confianca media</span><strong>{averages.trust}</strong></div>
        <div><span>Orientacoes novas</span><strong>{overview.advisors.filter((item) => item.status === "new").length}</strong></div>
        <div><span>Caixa</span><strong>{money(overview.club.cash_balance)}</strong></div>
      </section>

      <nav className="people-tabs" aria-label="Central de Pessoas">
        {tabs.map((item) => <button key={item.id} type="button" className={tab === item.id ? "active" : ""} onClick={() => chooseTab(item.id)}>{item.label}</button>)}
      </nav>
      {message ? <p className="people-message" role="status">{message}</p> : null}

      {tab === "team" ? <TeamView employees={overview.employees} selectedId={selectedEmployee?.id || ""} onSelect={setSelectedEmployeeId} /> : null}
      {tab === "meetings" ? (
        <section className="people-workspace" data-people-hub="meetings">
          <ContextTip tip="first-meeting" tutorial={tutorial} onDismiss={(tip) => patch("/api/tutorial", { action: "mark-tip", tip })}>
            O texto da conversa sera interpretado considerando contexto e personalidade. Promessas poderao ser lembradas depois.
          </ContextTip>
          <div className="people-form-panel">
            <h2>Sala de Reuniao</h2>
            <EmployeeSelector employees={overview.employees} value={selectedEmployee?.id || ""} onChange={setSelectedEmployeeId} />
            {selectedEmployee ? <form className="people-form" onSubmit={submitMeeting}>
              <label>Assunto<input name="subject" required minLength={3} maxLength={180} /></label>
              <label>Aptidao relacionada<select name="aptitudeTarget">{Object.keys(selectedEmployee.aptitudes).map((key) => <option key={key} value={key}>{aptitudeLabel(key)}</option>)}</select></label>
              <label className="people-check"><input type="checkbox" name="collective" /> Reuniao coletiva</label>
              <label className="full">Conversa<textarea name="text" required minLength={3} maxLength={5000} rows={7} /></label>
              <button className="people-primary" type="submit" disabled={busy}>Concluir reuniao</button>
            </form> : <EmptyState text="Sincronize ou contrate um funcionario para realizar reunioes." />}
            {meetingResult ? <MeetingReport payload={meetingResult} /> : null}
          </div>
          <div className="people-history-panel">
            <h2>Promessas</h2>
            <PromiseList promises={overview.promises} busy={busy} onResolve={(id, status) => patch("/api/staff/promises", { promiseId: id, status })} />
            <h2>Historico de reunioes</h2>
            <MeetingList meetings={overview.meetings} />
          </div>
        </section>
      ) : null}
      {tab === "courses" ? (
        <section className="people-workspace" data-people-hub="courses">
          <ContextTip tip="first-course" tutorial={tutorial} onDismiss={(tip) => patch("/api/tutorial", { action: "mark-tip", tip })}>
            Cursos desenvolvem a aptidao escolhida. Verifique custo, tempo, tolerancia e repeticao antes de contratar.
          </ContextTip>
          <div className="people-form-panel">
            <h2>Novo curso</h2>
            <EmployeeSelector employees={overview.employees} value={selectedEmployee?.id || ""} onChange={setSelectedEmployeeId} />
            {selectedEmployee ? <form className="people-form" onSubmit={submitCourse}>
              <label>Metodo<select name="courseType" defaultValue="ead">{Object.entries(COURSE_CATALOG).map(([id, item]) => <option key={id} value={id}>{item.label} - {money(item.cost)}</option>)}</select></label>
              <label>Nivel<select name="level" defaultValue="basic"><option value="basic">Basico</option><option value="intermediate">Intermediario</option><option value="advanced">Avancado</option></select></label>
              <label>Area<input name="domain" required maxLength={100} placeholder="Ex.: Preparacao Fisica" /></label>
              <label>Tema<input name="subject" required maxLength={160} placeholder="Ex.: Controle de carga" /></label>
              <label>Aptidao alvo<select name="aptitudeTarget">{Object.keys(selectedEmployee.aptitudes).map((key) => <option key={key} value={key}>{aptitudeLabel(key)}</option>)}</select></label>
              <label className="people-check"><input type="checkbox" name="selectedByEmployee" /> Escolhido pelo funcionario</label>
              <label className="people-check"><input type="checkbox" name="forced" /> Impor se houver resistencia</label>
              <button className="people-primary" type="submit" disabled={busy}>Contratar curso</button>
            </form> : <EmptyState text="Nao ha funcionario ativo para cursos." />}
          </div>
          <div className="people-history-panel">
            <h2>Cursos e saturacao</h2>
            <CourseList courses={overview.courses} employees={overview.employees} busy={busy} onCancel={(id) => patch("/api/staff/courses", { courseId: id, action: "cancel" })} />
          </div>
        </section>
      ) : null}
      {tab === "advisors" ? <AdvisorView messages={overview.advisors} employees={overview.employees} filter={advisorFilter} onFilter={setAdvisorFilter} busy={busy} onUpdate={(id, status) => patch("/api/staff/advisors", { messageId: id, status })} /> : null}
      {tab === "tutorial" ? <TutorialView data={tutorial} busy={busy} onAction={(action) => patch("/api/tutorial", { action })} /> : null}
    </div>
  );
}

function TeamView({ employees, selectedId, onSelect }: { employees: Employee[]; selectedId: string; onSelect: (id: string) => void }) {
  if (!employees.length) return <EmptyState text="Os funcionarios contratados no prototipo serao sincronizados aqui ao abrir esta area." />;
  return <section className="employee-grid">
    {employees.map((employee) => {
      const selected = employee.id === selectedId;
      const aptitudeAverage = average(Object.values(employee.aptitudes));
      return <article className={`employee-card ${selected ? "selected" : ""}`} key={employee.id}>
        <button type="button" className="employee-select" onClick={() => onSelect(employee.id)} aria-pressed={selected}>
          <span className="employee-avatar">{initials(employee.name)}</span>
          <span><strong>{employee.name}</strong><small>{employee.role_label}</small></span>
        </button>
        <dl className="employee-stats">
          <div><dt>Satisfacao</dt><dd>{employee.statusMetrics?.satisfactionLabel || "Pendente"} <b>{employee.statusMetrics?.satisfaction ?? "-"}</b></dd></div>
          <div><dt>Confianca</dt><dd>{employee.statusMetrics?.trust ?? "-"}</dd></div>
          <div><dt>Moral</dt><dd>{employee.statusMetrics?.morale ?? "-"}</dd></div>
          <div><dt>Aptidao media</dt><dd>{Math.round(aptitudeAverage)}</dd></div>
        </dl>
        <div className="personality-tags">{employee.personality.map((trait) => <span key={`${employee.id}-${trait.concept || trait.label}`}>{trait.label}</span>)}</div>
        <div className="employee-bars"><MetricBar label="Carga" value={employee.statusMetrics?.workload || 0} /><MetricBar label="Fadiga de reuniao" value={employee.statusMetrics?.meetingFatigue || 0} /><MetricBar label="Fadiga de curso" value={employee.statusMetrics?.trainingFatigue || 0} /></div>
        <details><summary>Aptidoes e memorias</summary><div className="aptitude-list">{Object.entries(employee.aptitudes).map(([key, value]) => <span key={key}>{aptitudeLabel(key)} <b>{Number(value).toFixed(1)}</b></span>)}</div>{employee.memories.slice(0, 4).map((memory) => <p className="memory-line" key={`${memory.created_at}-${memory.summary}`}>{memory.summary}</p>)}</details>
      </article>;
    })}
  </section>;
}

function EmployeeSelector({ employees, value, onChange }: { employees: Employee[]; value: string; onChange: (id: string) => void }) {
  return <label className="people-selector">Funcionario<select value={value} onChange={(event) => onChange(event.target.value)}>{employees.filter((item) => item.status === "active").map((employee) => <option value={employee.id} key={employee.id}>{employee.name} - {employee.role_label}</option>)}</select></label>;
}

function MeetingReport({ payload }: { payload: Record<string, unknown> }) {
  const evaluation = payload.evaluation as Record<string, unknown>;
  const interpretation = payload.interpretation as Record<string, unknown>;
  return <section className="meeting-report" aria-live="polite"><h3>Relatorio do Coordenador</h3><p>{String(evaluation.narrative || "Reuniao registrada.")}</p><div className="impact-row"><span>Satisfacao <b>{signed(Number(evaluation.satisfactionDelta))}</b></span><span>Confianca <b>{signed(Number(evaluation.trustDelta))}</b></span><span>Moral <b>{signed(Number(evaluation.moraleDelta))}</b></span><span>Aptidao <b>+{Number(evaluation.aptitudeDelta || 0).toFixed(3)}%</b></span><span>Fadiga <b>+{Number(evaluation.fatigueDelta || 0)}</b></span></div><p className="muted">Classificacao: {String(interpretation.meetingClassification)}; tom: {String(interpretation.tone)}.</p></section>;
}

function PromiseList({ promises, busy, onResolve }: { promises: Array<Record<string, unknown>>; busy: boolean; onResolve: (id: string, status: string) => void }) {
  if (!promises.length) return <EmptyState text="Nenhuma promessa registrada." />;
  return <div className="record-list">{promises.map((promise) => <article key={String(promise.id)} className="people-record"><strong>{String(promise.description)}</strong><span>{statusLabel(String(promise.status))}{promise.deadline ? ` · ate ${date(promise.deadline)}` : ""}</span>{promise.status === "active" ? <div className="record-actions"><button disabled={busy} onClick={() => onResolve(String(promise.id), "fulfilled")}>Marcar cumprida</button><button disabled={busy} onClick={() => onResolve(String(promise.id), "broken")}>Marcar quebrada</button></div> : null}</article>)}</div>;
}

function MeetingList({ meetings }: { meetings: Array<Record<string, unknown>> }) {
  if (!meetings.length) return <EmptyState text="Nenhuma reuniao realizada." />;
  return <div className="record-list">{meetings.map((meeting) => <article key={String(meeting.id)} className="people-record"><strong>{String(meeting.subject)}</strong><span>{String(meeting.meeting_type)} · {date(meeting.created_at)}</span></article>)}</div>;
}

function CourseList({ courses, employees, busy, onCancel }: { courses: Array<Record<string, unknown>>; employees: Employee[]; busy: boolean; onCancel: (id: string) => void }) {
  if (!courses.length) return <EmptyState text="Nenhum curso registrado." />;
  return <div className="record-list">{courses.map((course) => <article key={String(course.id)} className="people-record"><strong>{String(course.course_subject)}</strong><span>{employees.find((item) => item.id === course.employee_id)?.name || "Funcionario"} · {String(course.course_type).toUpperCase()} · {statusLabel(String(course.status))}</span><span>Ganho {Number(course.effective_gain).toFixed(2)}% · saturacao {Math.round(Number(course.saturation_factor) * 100)}% · {money(Number(course.cost))}</span>{["scheduled", "in_progress"].includes(String(course.status)) ? <div className="record-actions"><button disabled={busy} onClick={() => onCancel(String(course.id))}>Cancelar curso</button></div> : null}</article>)}</div>;
}

function AdvisorView({ messages, employees, filter, onFilter, busy, onUpdate }: { messages: Array<Record<string, unknown>>; employees: Employee[]; filter: string; onFilter: (value: string) => void; busy: boolean; onUpdate: (id: string, status: string) => void }) {
  const filtered = filter === "all" ? messages : filter === "important" ? messages.filter((item) => ["high", "critical"].includes(String(item.priority))) : messages.filter((item) => item.status === filter || item.tone === filter || item.event_type === filter);
  return <section className="advisor-section"><div className="advisor-toolbar"><h2>Central de Orientacoes</h2><select value={filter} onChange={(event) => onFilter(event.target.value)} aria-label="Filtrar orientacoes"><option value="new">Novas</option><option value="important">Importantes</option><option value="suggestion">Sugestoes</option><option value="complaint">Reclamacoes</option><option value="praise">Elogios</option><option value="all">Historico completo</option></select></div>{filtered.length ? <div className="advisor-list">{filtered.map((item) => { const employee = employees.find((candidate) => candidate.id === item.employee_id); return <article className={`advisor-card priority-${item.priority}`} key={String(item.id)}><header><span className="employee-avatar">{employee ? initials(employee.name) : "SI"}</span><div><strong>{employee?.name || "Sistema do clube"}</strong><small>{employee?.role_label || "Orientacao institucional"}</small></div><b>{priorityLabel(String(item.priority))}</b></header><h3>{String(item.title)}</h3><p>{String(item.message)}</p>{item.reason ? <p className="advisor-reason">{String(item.reason)}</p> : null}{item.recommendation ? <p><strong>Recomendacao:</strong> {String(item.recommendation)}</p> : null}<div className="record-actions"><button disabled={busy} onClick={() => onUpdate(String(item.id), "read")}>Marcar lida</button><button disabled={busy} onClick={() => onUpdate(String(item.id), "resolved")}>Resolver</button><button disabled={busy} onClick={() => onUpdate(String(item.id), "dismissed")}>Dispensar</button></div></article>; })}</div> : <EmptyState text="Nenhuma orientacao neste filtro." />}</section>;
}

function TutorialView({ data, busy, onAction }: { data: TutorialData | null; busy: boolean; onAction: (action: string) => void }) {
  if (!data?.progress) return <EmptyState text="Crie um clube para iniciar o tutorial." />;
  const progress = data.progress;
  const current = data.steps.find((step) => step.id === progress.current_step);
  return <section className="tutorial-center"><header><span className="tutorial-avatar">{data.advisor.initials}</span><div><h2>{data.advisor.name}</h2><p>{data.advisor.role} · {data.advisor.subtitle}</p></div></header><div className="tutorial-progress"><span style={{ width: `${progress.completed_steps.length * 10}%` }} /></div><strong>Status: {statusLabel(progress.status)}</strong><p>Etapa atual: {current?.title || "Tutorial concluido"}</p><ol>{data.steps.map((step) => <li className={progress.completed_steps.includes(step.id) ? "done" : step.id === progress.current_step ? "current" : ""} key={step.id}>{step.id}. {step.title}</li>)}</ol><div className="tutorial-center-actions">{progress.status !== "active" ? <button className="people-primary" disabled={busy} onClick={() => onAction("reopen")}>Reabrir tutorial</button> : <><button disabled={busy} onClick={() => onAction("back")}>Voltar</button><button disabled={busy} onClick={() => onAction("pause")}>Pausar</button><button disabled={busy} onClick={() => onAction("next")}>Continuar</button></>}</div></section>;
}

function ContextTip({ tip, tutorial, onDismiss, children }: { tip: string; tutorial: TutorialData | null; onDismiss: (tip: string) => void; children: React.ReactNode }) {
  const seen = tutorial?.progress?.contextual_tips_seen || [];
  if (seen.includes(tip)) return null;
  return <aside className="context-tip"><strong>Coordenadora Administrativa Interina</strong><p>{children}</p><button type="button" onClick={() => onDismiss(tip)}>Entendi</button></aside>;
}

function MetricBar({ label, value }: { label: string; value: number }) { return <div><span>{label}<b>{Math.round(value)}</b></span><i><em style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></i></div>; }
function EmptyState({ text }: { text: string }) { return <p className="people-empty">{text}</p>; }
function average(values: number[]) { return values.length ? values.reduce((sum, value) => sum + Number(value), 0) / values.length : 0; }
function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((item) => item[0]).join("").toUpperCase(); }
function signed(value: number) { return value > 0 ? `+${value}` : String(value); }
function money(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0); }
function date(value: unknown) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(String(value))); }
function statusLabel(value: string) { return ({ active: "Ativa", fulfilled: "Cumprida", broken: "Quebrada", cancelled: "Cancelado", scheduled: "Agendado", in_progress: "Em andamento", completed: "Concluido", paused: "Pausado", skipped: "Encerrado" } as Record<string, string>)[value] || value; }
function priorityLabel(value: string) { return ({ low: "Baixa", medium: "Media", high: "Alta", critical: "Critica" } as Record<string, string>)[value] || value; }
function aptitudeLabel(value: string) { return ({ technical: "Tecnica", tactical: "Tatica", fitness: "Fisica", medical: "Medica", analysis: "Analise", leadership: "Lideranca", negotiation: "Negociacao", finances: "Financas", marketing: "Marketing", management: "Gestao", scouting: "Observacao", youthDevelopment: "Desenvolvimento de jovens" } as Record<string, string>)[value] || value; }
