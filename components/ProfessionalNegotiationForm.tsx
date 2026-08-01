"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatBRL } from "@/lib/money";

export function ProfessionalNegotiationForm({ playerId }: { playerId: string }) {
  const [items, setItems] = useState<any[]>([]); const [message, setMessage] = useState(""); const [pending, setPending] = useState(false);
  async function refresh() { const response = await fetch(`/api/players/${playerId}/negotiations`); if (response.ok) setItems((await response.json()).negotiations || []); }
  useEffect(() => { void refresh(); }, [playerId]);
  async function offer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(""); const data=new FormData(event.currentTarget);
    const response=await fetch(`/api/players/${playerId}/negotiations`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"offer",role:data.get("role"),monthlySalary:data.get("monthlySalary"),signingBonus:data.get("signingBonus"),contractMonths:Number(data.get("contractMonths"))})});
    const body=await response.json(); setPending(false); setMessage(body.message || outcome(body.negotiation?.status)); if(response.ok) await refresh();
  }
  async function acceptCounter(id:string){setPending(true);const response=await fetch(`/api/players/${playerId}/negotiations`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"accept_counter",negotiationId:id})});const body=await response.json();setPending(false);setMessage(body.message || (response.ok?"Contraproposta aceita e contrato profissional registrado.":"Nao foi possivel aceitar."));if(response.ok)await refresh();}
  return <div className="negotiation-workspace"><form className="professional-offer" onSubmit={offer}><h3>Negociacao profissional</h3><p>O contrato de teste nao e convertido automaticamente.</p><label>Papel no elenco<select name="role" defaultValue="development"><option value="franchise">Referencia</option><option value="starter">Titular</option><option value="rotation">Rotacao</option><option value="reserve">Reserva</option><option value="development">Desenvolvimento</option></select></label><label>Salario mensal<input name="monthlySalary" inputMode="decimal" defaultValue="R$ 6.000,00" required /></label><label>Bonus de assinatura<input name="signingBonus" inputMode="decimal" defaultValue="R$ 0,00" required /></label><label>Duracao (meses)<input name="contractMonths" type="number" min="1" max="60" defaultValue="12" required /></label><button type="submit" disabled={pending}>{pending?"Enviando...":"Enviar proposta formal"}</button></form>{message?<p className="form-result">{message}</p>:null}<div className="negotiation-history">{items.map((item)=><article key={item.id}><strong>{status(item.status)}</strong><span>{formatBRL(item.monthly_salary)} por {item.contract_months} meses</span>{item.status==="countered"?<><small>Contraproposta: {formatBRL(item.counter_offer.monthlySalary)}</small><button type="button" disabled={pending} onClick={()=>acceptCounter(item.id)}>Aceitar contraproposta</button></>:null}</article>)}</div></div>;
}
function status(value:string){return({open:"Em analise",countered:"Contraproposta",accepted:"Aceita",rejected:"Recusada",time_requested:"Mais tempo solicitado",cancelled:"Cancelada"}as Record<string,string>)[value]||value;}
function outcome(value:string){return({accepted:"Proposta aceita. O vinculo profissional foi registrado.",countered:"O jogador apresentou uma contraproposta.",rejected:"O jogador recusou a proposta.",time_requested:"O jogador pediu mais tempo para decidir."}as Record<string,string>)[value]||"Proposta registrada.";}
