import { GameRoute } from "@/components/GameRoute";

export default async function OfficeSubroutePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return <GameRoute nextPath={`/escritorio/${slug.join("/")}`} />;
}
