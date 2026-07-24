import { AuthForm } from "@/components/AuthForm";
import { AuthPageShell } from "@/components/AuthPageShell";

export default function ResetPasswordPage() {
  return (
    <AuthPageShell>
      <AuthForm mode="reset" />
    </AuthPageShell>
  );
}
