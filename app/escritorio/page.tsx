import { GameRoute } from "@/components/GameRoute";

export default function OfficePage() {
  return <GameRoute requireVerification="whatsapp" nextPath="/escritorio" />;
}
