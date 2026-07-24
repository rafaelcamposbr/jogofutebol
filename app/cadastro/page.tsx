import { AuthForm } from "@/components/AuthForm";
import { AuthPageShell } from "@/components/AuthPageShell";

export default function SignupPage() {
  return (
    <AuthPageShell>
      <AuthForm mode="signup" />
    </AuthPageShell>
  );
}
