import { AuthPageShell } from "@/components/AuthPageShell";
import { PasswordUpdateForm } from "@/components/PasswordUpdateForm";

export default function UpdatePasswordPage() {
  return (
    <AuthPageShell>
      <section className="auth-card">
        <h2>Alterar senha</h2>
        <PasswordUpdateForm />
      </section>
    </AuthPageShell>
  );
}
