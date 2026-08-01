import type { Mentality } from "../tactics/engine.ts";

export type TeamSide = "home" | "away";
export type MatchPlayer = {
  id: string;
  name: string;
  position: string;
  role: string;
  overall: number;
  attack: number;
  creation: number;
  defense: number;
  physical: number;
  discipline: number;
  goalkeeper: number;
  condition: number;
  fatigue: number;
  isStarter: boolean;
};

export type MatchTeam = {
  side: TeamSide;
  name: string;
  mentality: Mentality;
  formation: string;
  players: MatchPlayer[];
};

export type MatchCommand = {
  id: string;
  commandType: "substitution" | "mentality" | "instruction";
  appliesFromMinute: number;
  payload: Record<string, unknown>;
};

export type MatchInput = {
  seed: string;
  version: "v1";
  home: MatchTeam;
  away: MatchTeam;
  commands: MatchCommand[];
};

export type MatchEvent = {
  eventIndex: number;
  minute: number;
  stoppage: number;
  teamSide: TeamSide | "neutral";
  playerId: string | null;
  secondaryPlayerId: string | null;
  eventType: string;
  zone: string;
  narrative: string;
  displayedXg: number | null;
  goalProbability: number | null;
  details: Record<string, unknown>;
};

export type TeamStats = {
  side: TeamSide;
  possession: number;
  shots: number;
  shotsOnTarget: number;
  xg: number;
  bigChances: number;
  corners: number;
  fouls: number;
  offsides: number;
  passAttempts: number;
  passesCompleted: number;
  chancesCreated: number;
  tacklesWon: number;
  interceptions: number;
  recoveries: number;
  aerialDuelsWon: number;
  saves: number;
  yellowCards: number;
  redCards: number;
  injuries: number;
  progressivePasses: number;
  finalThirdEntries: number;
  boxEntries: number;
  crosses: number;
  counterAttacks: number;
  turnovers: number;
  duels: number;
  fieldTilt: number;
  ppda: number;
};

export type PlayerStats = {
  playerId: string;
  playerName: string;
  teamSide: TeamSide;
  position: string;
  role: string;
  minutesPlayed: number;
  rating: number;
  goals: number;
  assists: number;
  xg: number;
  xa: number;
  shots: number;
  shotsOnTarget: number;
  passAttempts: number;
  passesCompleted: number;
  progressivePasses: number;
  keyPasses: number;
  crosses: number;
  dribbles: number;
  tackles: number;
  interceptions: number;
  blocks: number;
  duels: number;
  aerialDuels: number;
  fouls: number;
  foulsSuffered: number;
  offsides: number;
  yellowCards: number;
  redCards: number;
  turnovers: number;
  recoveries: number;
  boxActions: number;
  distanceKm: number;
  sprints: number;
  fatigue: number;
  goalkeeper: { saves: number; goalsConceded: number; shotsOnTargetFaced: number; preventedGoals: number; claims: number; errors: number; penaltiesSaved: number };
};

export type MatchSimulation = {
  throughMinute: number;
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  teamStats: Record<TeamSide, TeamStats>;
  playerStats: Record<string, PlayerStats>;
  activePlayerIds: Record<TeamSide, string[]>;
  substitutions: Array<{ minute: number; side: TeamSide; playerOutId: string; playerInId: string; reason: string }>;
  injuries: Array<{ minute: number; side: TeamSide; playerId: string; severity: string; forcedSubstitution: boolean }>;
};
