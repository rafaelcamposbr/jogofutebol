import { AuthForm } from "@/components/AuthForm";
import { AuthPageShell } from "@/components/AuthPageShell";

export default function LoginPage() {
  return (
    <AuthPageShell>
      <AuthForm mode="login" />
    </AuthPageShell>
  );
}
