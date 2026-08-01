import { GameRoute } from "@/components/GameRoute";

export default async function OfficeSubroutePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return <GameRoute requireVerification="whatsapp" nextPath={`/escritorio/${slug.join("/")}`} />;
}
