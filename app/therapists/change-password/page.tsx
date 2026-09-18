import { redirect } from "next/navigation";

export default function LegacyTherapistPasswordRedirect() {
  redirect("/therapist-panel/change-password");
}
