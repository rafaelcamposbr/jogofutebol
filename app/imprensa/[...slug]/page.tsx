import { GameRoute } from "@/components/GameRoute";

export default function PressSubroutePage() {
  return <GameRoute requireVerification="email" nextPath="/imprensa" />;
}
