import { Suspense } from "react";
import LoginForm from "@/components/ui/LoginForm";

export const metadata = {
  title: "FootMatch - Connexion",
  description: "Connecte-toi pour rejoindre des matchs de foot",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
