import { clamp, createSeededRandom } from "../random.ts";
import { mentalityModifier, resolveFoul, resolveInjury, resolveShot } from "./actions.ts";
import type { MatchCommand, MatchEvent, MatchInput, MatchPlayer, MatchSimulation, PlayerStats, TeamSide, TeamStats } from "./types.ts";

function emptyTeamStats(side: TeamSide): TeamStats {
  return { side, possession: 50, shots: 0, shotsOnTarget: 0, xg: 0, bigChances: 0, corners: 0, fouls: 0, offsides: 0, passAttempts: 0, passesCompleted: 0, chancesCreated: 0, tacklesWon: 0, interceptions: 0, recoveries: 0, aerialDuelsWon: 0, saves: 0, yellowCards: 0, redCards: 0, injuries: 0, progressivePasses: 0, finalThirdEntries: 0, boxEntries: 0, crosses: 0, counterAttacks: 0, turnovers: 0, duels: 0, fieldTilt: 50, ppda: 12 };
}

function emptyPlayerStats(player: MatchPlayer, side: TeamSide): PlayerStats {
  return { playerId: player.id, playerName: player.name, teamSide: side, position: player.position, role: player.role, minutesPlayed: 0, rating: 6, goals: 0, assists: 0, xg: 0, xa: 0, shots: 0, shotsOnTarget: 0, passAttempts: 0, passesCompleted: 0, progressivePasses: 0, keyPasses: 0, crosses: 0, dribbles: 0, tackles: 0, interceptions: 0, blocks: 0, duels: 0, aerialDuels: 0, fouls: 0, foulsSuffered: 0, offsides: 0, yellowCards: 0, redCards: 0, turnovers: 0, recoveries: 0, boxActions: 0, distanceKm: 0, sprints: 0, fatigue: player.fatigue, goalkeeper: { saves: 0, goalsConceded: 0, shotsOnTargetFaced: 0, preventedGoals: 0, claims: 0, errors: 0, penaltiesSaved: 0 } };
}

function selectOutfield(random: ReturnType<typeof createSeededRandom>, players: MatchPlayer[], attacking = false) {
  const candidates = players.filter((player) => player.position !== "GK");
  const weighted = candidates.flatMap((player) => {
    const positional = attacking && ["ST", "SS", "AM", "LW", "RW"].includes(player.position) ? 4 : ["CM", "DM", "RM", "LM"].includes(player.position) ? 2 : 1;
    return Array.from({ length: positional }, () => player);
  });
  return random.pick(weighted.length ? weighted : players);
}

function eventNarrative(random: ReturnType<typeof createSeededRandom>, type: string, player: string, team: string) {
  const templates: Record<string, string[]> = {
    goal: [`${player} finaliza com precisao e marca para ${team}.`, `${team} encontra o espaco, e ${player} converte a chance.`, `${player} vence o goleiro e altera o placar.`],
    save: [`O goleiro reage bem a finalizacao de ${player}.`, `${player} acerta o alvo, mas a defesa segura.`, `Boa chegada de ${player}; o goleiro evita o gol.`],
    miss: [`${player} conclui a jogada, mas manda para fora.`, `A tentativa de ${player} nao encontra o alvo.`, `${player} finaliza sob pressao e erra o gol.`],
    yellow_card: [`${player} recebe cartao amarelo apos interromper a jogada.`, `Entrada atrasada de ${player}; o arbitro mostra o amarelo.`],
    red_card: [`${player} e expulso e deixa sua equipe com um jogador a menos.`, `Cartao vermelho para ${player} apos uma falta grave.`],
  };
  return random.pick(templates[type] || [`${player} participa de uma acao relevante para ${team}.`]);
}

function activeFor(team: MatchInput["home"], removed: Set<string>, added: Set<string>) {
  return team.players.filter((player) => (player.isStarter && !removed.has(player.id)) || added.has(player.id));
}

function applyCommands(minute: number, commands: MatchCommand[], state: {
  active: Record<TeamSide, MatchPlayer[]>; removed: Record<TeamSide, Set<string>>; added: Record<TeamSide, Set<string>>;
  mentalities: Record<TeamSide, string>; events: MatchEvent[]; substitutions: MatchSimulation["substitutions"];
}, input: MatchInput) {
  commands.filter((command) => command.appliesFromMinute === minute).forEach((command) => {
    const side = command.payload.side === "away" ? "away" : "home";
    if (command.commandType === "mentality") {
      state.mentalities[side] = String(command.payload.mentality || state.mentalities[side]);
      state.events.push({ eventIndex: 0, minute, stoppage: 0, teamSide: side, playerId: null, secondaryPlayerId: null, eventType: "tactical_change", zone: "technical_area", narrative: `${side === "home" ? input.home.name : input.away.name} ajusta a mentalidade para ${state.mentalities[side]}.`, displayedXg: null, goalProbability: null, details: { commandId: command.id } });
    }
    if (command.commandType === "instruction") {
      state.events.push({ eventIndex: 0, minute, stoppage: 0, teamSide: side, playerId: null, secondaryPlayerId: null, eventType: "team_talk", zone: "dressing_room", narrative: "A orientacao coletiva e assimilada antes do reinicio.", displayedXg: null, goalProbability: null, details: { commandId: command.id, context: command.payload.context || "match" } });
    }
    if (command.commandType === "substitution") {
      const outId = String(command.payload.playerOutId || "");
      const inId = String(command.payload.playerInId || "");
      const team = side === "home" ? input.home : input.away;
      const outPlayer = state.active[side].find((player) => player.id === outId);
      const inPlayer = team.players.find((player) => player.id === inId && !state.active[side].some((active) => active.id === player.id));
      if (outPlayer && inPlayer && state.substitutions.filter((item) => item.side === side).length < 5) {
        state.removed[side].add(outPlayer.id); state.added[side].add(inPlayer.id);
        state.active[side] = activeFor(team, state.removed[side], state.added[side]);
        state.substitutions.push({ minute, side, playerOutId: outPlayer.id, playerInId: inPlayer.id, reason: "user_command" });
        state.events.push({ eventIndex: 0, minute, stoppage: 0, teamSide: side, playerId: inPlayer.id, secondaryPlayerId: outPlayer.id, eventType: "substitution", zone: "technical_area", narrative: `${inPlayer.name} entra no lugar de ${outPlayer.name}.`, displayedXg: null, goalProbability: null, details: { commandId: command.id } });
      }
    }
  });
}

export function simulateMatch(input: MatchInput, throughMinute = 90): MatchSimulation {
  const targetMinute = Math.max(0, Math.min(90, Math.floor(throughMinute)));
  const events: MatchEvent[] = [];
  const teamStats = { home: emptyTeamStats("home"), away: emptyTeamStats("away") };
  const playerStats: Record<string, PlayerStats> = {};
  (["home", "away"] as TeamSide[]).forEach((side) => (side === "home" ? input.home : input.away).players.forEach((player) => { playerStats[player.id] = emptyPlayerStats(player, side); }));
  const removed = { home: new Set<string>(), away: new Set<string>() };
  const added = { home: new Set<string>(), away: new Set<string>() };
  const active = { home: activeFor(input.home, removed.home, added.home), away: activeFor(input.away, removed.away, added.away) };
  const mentalities: Record<TeamSide, string> = { home: input.home.mentality, away: input.away.mentality };
  const substitutions: MatchSimulation["substitutions"] = [];
  const injuries: MatchSimulation["injuries"] = [];
  const yellowCounts: Record<string, number> = {};
  const possessionActions = { home: 0, away: 0 };
  let homeScore = 0; let awayScore = 0;

  for (let minute = 1; minute <= targetMinute; minute += 1) {
    applyCommands(minute, input.commands, { active, removed, added, mentalities, events, substitutions }, input);
    (["home", "away"] as TeamSide[]).forEach((side) => {
      active[side].forEach((player) => {
        const stat = playerStats[player.id];
        stat.minutesPlayed += 1;
        stat.distanceKm = Number((stat.distanceKm + (player.position === "GK" ? 0.035 : 0.095 + player.physical / 2800)).toFixed(3));
        if (player.position !== "GK" && minute % Math.max(3, 9 - Math.round(player.physical / 18)) === 0) stat.sprints += 1;
        stat.fatigue = Number(clamp(player.fatigue + minute * (0.055 + (100 - player.physical) / 2600), 0, 100).toFixed(2));
      });
    });
    const random = createSeededRandom(`${input.seed}:${input.version}:minute:${minute}`);
    const possessions = random.int(4, 8);
    for (let possession = 0; possession < possessions; possession += 1) {
      const homeQuality = average(active.home, "creation");
      const awayQuality = average(active.away, "creation");
      const homeShare = clamp(0.5 + (homeQuality - awayQuality) / 360 + mentalityModifier(mentalities.home, "home") + mentalityModifier(mentalities.away, "away"), 0.34, 0.66);
      const side: TeamSide = random.chance(homeShare) ? "home" : "away";
      const other: TeamSide = side === "home" ? "away" : "home";
      possessionActions[side] += 1;
      const passer = selectOutfield(random, active[side]);
      const passes = random.int(2, 7);
      const completionProbability = clamp(0.58 + passer.creation / 310 - average(active[other], "defense") / 720, 0.58, 0.91);
      const completed = Array.from({ length: passes }).filter(() => random.chance(completionProbability)).length;
      teamStats[side].passAttempts += passes; teamStats[side].passesCompleted += completed;
      playerStats[passer.id].passAttempts += passes; playerStats[passer.id].passesCompleted += completed;
      if (completed >= 4 && random.chance(0.35)) { teamStats[side].progressivePasses += 1; playerStats[passer.id].progressivePasses += 1; }
      if (completed < passes - 2) { teamStats[side].turnovers += 1; playerStats[passer.id].turnovers += 1; teamStats[other].recoveries += 1; }
      if (random.chance(0.044 + Math.max(0, average(active[side], "attack") - average(active[other], "defense")) / 2500)) {
        const shooter = selectOutfield(random, active[side], true);
        const goalkeeper = active[other].find((player) => player.position === "GK") || active[other][0];
        const creator = passer.id === shooter.id ? null : passer;
        const zone = random.chance(0.08) ? "six_yard" : random.chance(0.48) ? "box_center" : random.chance(0.5) ? "box_wide" : "edge";
        const shot = resolveShot({ random, shooter, goalkeeper, zone, pressure: clamp(average(active[other], "defense") / 100, 0.25, 0.9) });
        teamStats[side].shots += 1; teamStats[side].xg = Number((teamStats[side].xg + shot.displayedXg).toFixed(3));
        teamStats[side].boxEntries += zone === "edge" ? 0 : 1; teamStats[side].finalThirdEntries += 1;
        if (shot.displayedXg >= 0.3) teamStats[side].bigChances += 1;
        playerStats[shooter.id].shots += 1; playerStats[shooter.id].xg = Number((playerStats[shooter.id].xg + shot.displayedXg).toFixed(3)); playerStats[shooter.id].boxActions += zone === "edge" ? 0 : 1;
        if (creator) { playerStats[creator.id].keyPasses += 1; playerStats[creator.id].xa = Number((playerStats[creator.id].xa + shot.displayedXg).toFixed(3)); teamStats[side].chancesCreated += 1; }
        let type = "miss";
        if (shot.onTarget) {
          type = shot.goal ? "goal" : "save"; teamStats[side].shotsOnTarget += 1; playerStats[shooter.id].shotsOnTarget += 1;
          playerStats[goalkeeper.id].goalkeeper.shotsOnTargetFaced += 1;
          if (shot.goal) {
            if (side === "home") homeScore += 1; else awayScore += 1;
            playerStats[shooter.id].goals += 1; playerStats[shooter.id].rating += 0.82;
            playerStats[goalkeeper.id].goalkeeper.goalsConceded += 1;
            if (creator) { playerStats[creator.id].assists += 1; playerStats[creator.id].rating += 0.42; }
          } else {
            teamStats[other].saves += 1; playerStats[goalkeeper.id].goalkeeper.saves += 1;
            playerStats[goalkeeper.id].goalkeeper.preventedGoals = Number((playerStats[goalkeeper.id].goalkeeper.preventedGoals + shot.displayedXg).toFixed(3));
            playerStats[goalkeeper.id].rating += 0.12 + shot.displayedXg * 0.35;
          }
        }
        events.push({ eventIndex: 0, minute, stoppage: 0, teamSide: side, playerId: shooter.id, secondaryPlayerId: creator?.id || null, eventType: type, zone, narrative: eventNarrative(random, type, shooter.name, side === "home" ? input.home.name : input.away.name), displayedXg: shot.displayedXg, goalProbability: shot.goalProbability, details: { onTarget: shot.onTarget } });
      } else if (random.chance(0.024)) {
        const defender = selectOutfield(random, active[other]);
        const victim = selectOutfield(random, active[side]);
        const foul = resolveFoul(random, defender);
        teamStats[other].fouls += 1; playerStats[defender.id].fouls += 1; playerStats[victim.id].foulsSuffered += 1;
        if (foul.yellow || foul.directRed) {
          yellowCounts[defender.id] = (yellowCounts[defender.id] || 0) + (foul.yellow ? 1 : 0);
          const secondYellow = yellowCounts[defender.id] >= 2;
          const red = foul.directRed || secondYellow;
          if (foul.yellow) { teamStats[other].yellowCards += 1; playerStats[defender.id].yellowCards += 1; }
          if (red) { teamStats[other].redCards += 1; playerStats[defender.id].redCards += 1; removed[other].add(defender.id); active[other] = activeFor(other === "home" ? input.home : input.away, removed[other], added[other]); }
          const type = red ? "red_card" : "yellow_card";
          events.push({ eventIndex: 0, minute, stoppage: 0, teamSide: other, playerId: defender.id, secondaryPlayerId: victim.id, eventType: type, zone: "middle_third", narrative: eventNarrative(random, type, defender.name, other === "home" ? input.home.name : input.away.name), displayedXg: null, goalProbability: null, details: { secondYellow } });
        }
      } else if (random.chance(0.012)) teamStats[side].corners += 1;
      const injuryTarget = random.pick(active[side]);
      const injury = resolveInjury(random, { ...injuryTarget, fatigue: playerStats[injuryTarget.id].fatigue }, minute);
      if (injury) {
        teamStats[side].injuries += 1; injuries.push({ side, ...injury });
        events.push({ eventIndex: 0, minute, stoppage: 0, teamSide: side, playerId: injuryTarget.id, secondaryPlayerId: null, eventType: "injury", zone: "field", narrative: `${injuryTarget.name} pede atendimento e deixa o campo para avaliacao.`, displayedXg: null, goalProbability: null, details: { severity: injury.severity, forcedSubstitution: injury.forcedSubstitution } });
        if (injury.forcedSubstitution) { removed[side].add(injuryTarget.id); active[side] = activeFor(side === "home" ? input.home : input.away, removed[side], added[side]); }
      }
    }
    if (minute === 45) events.push({ eventIndex: 0, minute, stoppage: 0, teamSide: "neutral", playerId: null, secondaryPlayerId: null, eventType: "halftime", zone: "field", narrative: `Intervalo: ${input.home.name} ${homeScore} x ${awayScore} ${input.away.name}.`, displayedXg: null, goalProbability: null, details: {} });
  }
  if (targetMinute === 90) events.push({ eventIndex: 0, minute: 90, stoppage: 0, teamSide: "neutral", playerId: null, secondaryPlayerId: null, eventType: "fulltime", zone: "field", narrative: `Fim de jogo: ${input.home.name} ${homeScore} x ${awayScore} ${input.away.name}.`, displayedXg: null, goalProbability: null, details: {} });
  events.forEach((event, index) => { event.eventIndex = index + 1; });
  const totalPossessions = possessionActions.home + possessionActions.away || 1;
  teamStats.home.possession = Number((possessionActions.home / totalPossessions * 100).toFixed(2));
  teamStats.away.possession = Number((100 - teamStats.home.possession).toFixed(2));
  const totalEntries = teamStats.home.finalThirdEntries + teamStats.away.finalThirdEntries || 1;
  teamStats.home.fieldTilt = Number((teamStats.home.finalThirdEntries / totalEntries * 100).toFixed(1)); teamStats.away.fieldTilt = Number((100 - teamStats.home.fieldTilt).toFixed(1));
  (["home", "away"] as TeamSide[]).forEach((side) => {
    const opponent: TeamSide = side === "home" ? "away" : "home";
    teamStats[side].ppda = Number(clamp(teamStats[opponent].passAttempts / Math.max(1, teamStats[side].tacklesWon + teamStats[side].interceptions + teamStats[side].fouls), 4, 28).toFixed(1));
  });
  Object.values(playerStats).forEach((stat) => {
    stat.rating = Number(clamp(stat.rating + stat.keyPasses * 0.07 + stat.tackles * 0.04 + stat.interceptions * 0.05 - stat.turnovers * 0.018 - stat.redCards * 1.2, 3, 10).toFixed(2));
  });
  return { throughMinute: targetMinute, homeScore, awayScore, events, teamStats, playerStats, activePlayerIds: { home: active.home.map((player) => player.id), away: active.away.map((player) => player.id) }, substitutions, injuries };
}

function average(players: MatchPlayer[], key: "attack" | "creation" | "defense") {
  return players.reduce((sum, player) => sum + player[key], 0) / Math.max(1, players.length);
}
