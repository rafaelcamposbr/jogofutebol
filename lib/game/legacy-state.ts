import { APP_ENV, APP_VERSION } from "@/lib/env";

export type ClubRecord = {
  id: string;
  owner_id: string;
  name: string;
  short_name: string;
  abbreviation: string;
  hashtag: string;
  city: string;
  state: string;
  legal_model: "association" | "saf";
  founded_at: string;
  primary_color: string;
  secondary_color: string;
  accent_color?: string | null;
  crest_url?: string | null;
  mascot?: string | null;
  cash_balance: number;
  institutional_reputation: number;
  financial_reputation: number;
  sporting_reputation: number;
};

export type PressReleaseRecord = {
  id: string;
  title: string;
  content: string;
  category: string;
  status: "draft" | "scheduled" | "published" | "removed";
  published_at?: string | null;
  scheduled_at?: string | null;
  institutional_impact?: number | null;
  financial_impact?: number | null;
  sporting_impact?: number | null;
  created_at: string;
};

export type EventRecord = {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  starts_at?: string | null;
  financial_impact?: number | null;
  created_at: string;
};

export function buildLegacyState(club: ClubRecord, pressReleases: PressReleaseRecord[] = [], events: EventRecord[] = []) {
  const foundedAt = club.founded_at || new Date().toISOString();
  return {
    version: 2,
    beta: {
      environment: APP_ENV,
      version: APP_VERSION,
    },
    club: {
      fullName: club.name,
      shortName: club.short_name,
      acronym: club.abbreviation,
      city: club.city,
      state: club.state,
      legalModel: club.legal_model,
      mascot: club.mascot || "",
      colors: {
        primary: club.primary_color,
        secondary: club.secondary_color,
        accent: club.accent_color || "#d8a21a",
      },
      shieldShape: "shield",
      uniformPattern: "plain",
      foundedAt,
      hashtag: club.hashtag,
      supabaseClubId: club.id,
    },
    finance: { cash: club.cash_balance || 0 },
    reputations: {
      institutional: { value: club.institutional_reputation ?? 1, history: [{ date: foundedAt, value: club.institutional_reputation ?? 1, reason: "Valor inicial do clube." }] },
      financial: { value: club.financial_reputation ?? 1, history: [{ date: foundedAt, value: club.financial_reputation ?? 1, reason: "Valor inicial do clube." }] },
      sporting: { value: club.sporting_reputation ?? 0.5, history: [{ date: foundedAt, value: club.sporting_reputation ?? 0.5, reason: "Valor inicial do clube." }] },
    },
    press: {
      communications: pressReleases.map((release) => ({
        id: release.id,
        title: release.title,
        text: release.content,
        category: release.category,
        publishAt: release.published_at || release.scheduled_at || release.created_at,
        clubId: "my-club",
        author: "Diretoria",
        reach: release.status === "published" ? 1200 : 0,
        locality: "city",
        hashtags: [club.hashtag],
        status: release.status === "removed" ? "withdrawn" : release.status,
        impact: {
          institutional: release.institutional_impact || 0,
          financial: release.financial_impact || 0,
          sporting: release.sporting_impact || 0,
        },
        relevance: 55,
        repercussion: "institucional",
      })),
      horizonFilter: "city",
      transferFilter: "recent",
      clubSearch: "",
      profileSlug: null,
      profileTab: "overview",
      followedClubIds: [],
    },
    events: events.map((event) => ({
      id: event.id,
      type: event.type,
      title: event.title,
      description: event.description || event.title,
      date: event.starts_at || event.created_at,
      financialImpact: event.financial_impact || 0,
    })),
    players: { squad: [], tryoutFindings: [], youth: [] },
    staff: { market: [], proposals: [], employees: [], development: [], history: [], filters: {}, activeTab: "overview" },
    facilities: { municipalField: null, adminRooms: [], lands: [], trainingCenter: { facilities: [] }, stadium: { modules: [], rentals: [] } },
    sponsorships: { quotas: [], proposals: [], contracts: [] },
    donations: { confirmed: false, acceptedIds: [] },
    municipalGrant: { status: "not_requested" },
    constructions: [],
    promises: [],
    youthAcademy: { coaches: 20, scouts: 20, methodology: 20 },
    offlineReport: null,
    lastUpdateAt: new Date().toISOString(),
  };
}

export function buildGuestLegacyState() {
  return buildLegacyState({
    id: "demo-guest-club",
    owner_id: "guest",
    name: "Clube Visitante Horizonte",
    short_name: "Visitante Horizonte",
    abbreviation: "CVH",
    hashtag: "#visitantehorizonte",
    city: "Campinas",
    state: "SP",
    legal_model: "association",
    founded_at: new Date().toISOString(),
    primary_color: "#0b7a53",
    secondary_color: "#ffffff",
    accent_color: "#d8a21a",
    mascot: "Cometa",
    cash_balance: 0,
    institutional_reputation: 1,
    financial_reputation: 1,
    sporting_reputation: 0.5,
  }, [], [
    {
      id: "demo-event-beta",
      type: "beta",
      title: "Modo visitante ativo",
      description: "Dados demonstrativos temporarios para testar a navegacao da beta.",
      created_at: new Date().toISOString(),
      starts_at: new Date().toISOString(),
      financial_impact: 0,
    },
  ]);
}
