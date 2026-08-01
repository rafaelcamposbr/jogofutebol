import { GameRoute } from "@/components/GameRoute";

export default async function PressSubroutePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return <GameRoute nextPath={`/imprensa/${slug.join("/")}`} />;
}
