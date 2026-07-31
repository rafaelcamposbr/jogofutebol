import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { APP_ENV, APP_VERSION, isProblemReportingEnabled } from "@/lib/env";
import { FeedbackButton } from "@/components/FeedbackButton";

export const metadata: Metadata = {
  title: "Simulador de Gestao de Clube - Beta",
  description: "Beta online do simulador de gestao de clubes de futebol.",
  metadataBase: new URL("https://simulador-gestao-clube-beta.vercel.app"),
  openGraph: {
    title: "Simulador de Gestao de Clube - Beta",
    description: "Teste remoto da primeira beta navegavel do jogo.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="stylesheet" href="/legacy/styles.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__APP_ENV__=${JSON.stringify(APP_ENV)};window.__APP_VERSION__=${JSON.stringify(APP_VERSION)};`,
          }}
        />
      </head>
      <body>
        <div className="skip-links">
          <Link href="#conteudo">Pular para o conteudo</Link>
        </div>
        <div id="conteudo">{children}</div>
        {isProblemReportingEnabled() ? <FeedbackButton /> : null}
      </body>
    </html>
  );
}
