import Link from "next/link";
import type { Metadata } from "next";
import { AuthForm } from "@/components/interactive";
import { SiteHeader } from "@/components/site-header-server";
import { createPageMetadata } from "@/lib/seo";
export const metadata: Metadata = createPageMetadata("ثبت‌نام");
export default function SignupPage(){return <><SiteHeader/><main className="container-oz flex min-h-[calc(100vh-80px)] items-center justify-center py-12"><div className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-[0_12px_40px_rgba(53,88,89,.08)] md:p-10"><div className="mb-8 text-center"><div className="text-3xl font-black text-[#355859]">شروع یک مسیر تازه</div><p className="mt-2 text-[#676b6b]">حساب اُزون خود را بسازید.</p></div><AuthForm mode="signup"/><p className="mt-6 text-center text-sm text-[#676b6b]">قبلاً ثبت‌نام کرده‌اید؟ <Link className="font-bold text-[#0f8b8d]" href="/login">وارد شوید</Link></p></div></main></>}
