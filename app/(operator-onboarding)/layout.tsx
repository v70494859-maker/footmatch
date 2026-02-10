import type { Metadata } from "next";
import StepProgress from "@/components/operator-onboarding/StepProgress";

export const metadata: Metadata = {
  title: "FootMatch - Devenir opérateur",
  description: "Postulez pour devenir opérateur FootMatch et organisez des matchs",
};

export default function OperatorOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-lg">
        <StepProgress />
        {children}
      </div>
    </div>
  );
}
