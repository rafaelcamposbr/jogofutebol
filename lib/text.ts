export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "clube";
}

export function makeClubHashtag(value: string) {
  return `#${slugify(value).replace(/-/g, "")}`;
}

export function clampText(value: FormDataEntryValue | null, max: number) {
  return String(value || "").trim().slice(0, max);
}
