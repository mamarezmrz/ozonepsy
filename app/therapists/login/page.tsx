import { redirect } from "next/navigation";

export default function LegacyTherapistLoginRedirect() {
  redirect("/therapist-panel/login");
}
