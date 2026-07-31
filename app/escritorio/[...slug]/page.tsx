import { GameRoute } from "@/components/GameRoute";

export default function OfficeSubroutePage() {
  return <GameRoute requireVerification="whatsapp" nextPath="/escritorio" />;
}
