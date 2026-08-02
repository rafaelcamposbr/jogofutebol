import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const roots = ["app", "components", "lib"];
const files = roots.flatMap(walk).filter((file) => /\.(tsx?|jsx?)$/.test(file));
const problems = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const button of source.matchAll(/<button\b[^>]*>/g)) {
    if (!/\btype=/.test(button[0])) problems.push(`${file}: botao sem type explicito`);
  }
  if (/router\.back\(|history\.back\(|window\.history\.back/.test(source)) problems.push(`${file}: retorno depende apenas do historico`);
  if (/href=["']#["']/.test(source)) problems.push(`${file}: link visivel sem destino`);
}

const matchUi = readFileSync("components/MatchCenter.tsx", "utf8");
for (const forbidden of ["setInterval", "setTimeout", '"/process"', "current_minute", "home_score", "away_score", "Velocidade", "Pausar"]) {
  if (matchUi.includes(forbidden)) problems.push(`components/MatchCenter.tsx: conceito ao vivo encontrado (${forbidden})`);
}

const requiredRoutes = [
  "app/escritorio/page.tsx", "app/elenco/page.tsx", "app/mercado/page.tsx",
  "app/imprensa/page.tsx", "app/calendario/page.tsx", "app/minha-conta/page.tsx",
  "app/calendario/partidas/[id]/page.tsx",
];
for (const route of requiredRoutes) if (!existsSync(route)) problems.push(`${route}: rota principal ausente`);

const migration = "supabase/migrations/20260802013045_managed_match_lifecycle_and_private_truth.sql";
if (!existsSync(migration)) problems.push(`${migration}: migration de privacidade ausente`);
else {
  const sql = readFileSync(migration, "utf8");
  if (!/revoke select on public\.match_states/i.test(sql)) problems.push(`${migration}: match_states continua exposta`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`Auditoria estatica concluida: ${files.length} arquivos, botoes tipados, rotas principais presentes e partida sem controles ao vivo.`);

function walk(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? walk(path) : [relative(process.cwd(), path)];
  });
}
