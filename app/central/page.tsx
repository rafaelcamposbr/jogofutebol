import { redirectToAuthenticatedHome } from "@/lib/auth/home";

export const dynamic = "force-dynamic";

export default async function CentralPage() {
  await redirectToAuthenticatedHome("/central", "/login");
}
