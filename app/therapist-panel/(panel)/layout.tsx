import { redirect } from "next/navigation";
import { TherapistShell } from "@/components/therapist-shell";
import { requireTherapist, TherapistAuthorizationError } from "@/lib/auth/therapist";

async function getPanelTherapist() {
  try {
    return await requireTherapist();
  } catch (error) {
    if (!(error instanceof TherapistAuthorizationError)) throw error;
    if (error.code === "MUST_CHANGE_PASSWORD") redirect("/therapist-panel/change-password");
    redirect("/therapist-panel/login");
  }
}

export default async function TherapistPanelLayout({ children }: { children: React.ReactNode }) {
  const therapist = await getPanelTherapist();
  return <TherapistShell therapist={therapist}>{children}</TherapistShell>;
}
