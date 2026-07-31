import { GameRoute } from "@/components/GameRoute";

export default function PressPage() {
  return <GameRoute requireVerification="email" nextPath="/imprensa" />;
}
