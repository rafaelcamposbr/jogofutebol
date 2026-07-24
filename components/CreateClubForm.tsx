"use client";

import { useActionState } from "react";
import { createClubAction, type CreateClubState } from "@/app/criar-clube/actions";

const initialState: CreateClubState = {};

export function CreateClubForm() {
  const [state, formAction, pending] = useActionState(createClubAction, initialState);

  return (
    <form className="club-form" action={formAction}>
      <label>
        Nome completo
        <input name="name" maxLength={120} required placeholder="Futebol Clube Horizonte" />
      </label>
      <label>
        Nome curto
        <input name="shortName" maxLength={60} required placeholder="Horizonte" />
      </label>
      <label>
        Sigla
        <input name="abbreviation" maxLength={4} required placeholder="HOR" />
      </label>
      <label>
        Modelo juridico
        <select name="legalModel" defaultValue="association">
          <option value="association">Associacao</option>
          <option value="saf">SAF</option>
        </select>
      </label>
      <label>
        Cidade
        <input name="city" maxLength={80} required placeholder="Campinas" />
      </label>
      <label>
        UF
        <input name="state" maxLength={2} required placeholder="SP" />
      </label>
      <label>
        Mascote
        <input name="mascot" maxLength={60} placeholder="Cometa" />
      </label>
      <label>
        Cor principal
        <input name="primaryColor" type="color" defaultValue="#0b7a53" />
      </label>
      <label>
        Cor secundaria
        <input name="secondaryColor" type="color" defaultValue="#ffffff" />
      </label>
      <label>
        Cor de detalhe
        <input name="accentColor" type="color" defaultValue="#d8a21a" />
      </label>
      {state.error ? <p className="feedback-message error full">{state.error}</p> : null}
      <div className="full">
        <button className="club-submit" type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar clube"}
        </button>
      </div>
    </form>
  );
}
