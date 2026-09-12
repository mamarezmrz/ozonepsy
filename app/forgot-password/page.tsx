import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "بازیابی رمز ورود", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  redirect("/?auth=forgot");
}
