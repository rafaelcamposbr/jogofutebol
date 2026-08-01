export const ROOM_OPTIONS = [
  { id: "compact", label: "Sala compacta", capacity: 4, purchaseCents: 2_500_000, rentCents: 350_000 },
  { id: "standard", label: "Sala padrao", capacity: 8, purchaseCents: 6_000_000, rentCents: 800_000 },
  { id: "department", label: "Andar departamental", capacity: 18, purchaseCents: 14_500_000, rentCents: 1_850_000 },
] as const;
export function getRoomOption(id: string) { return ROOM_OPTIONS.find((item) => item.id === id) || null; }
