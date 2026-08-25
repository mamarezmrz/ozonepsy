import { Button } from "@/components/ui";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header-server";
import { createPageMetadata } from "@/lib/seo";
export const metadata: Metadata = createPageMetadata("پرداخت موفق");
export default function PaymentSuccessPage(){return <><SiteHeader/><main className="container-oz flex min-h-[70vh] items-center justify-center py-16"><div className="w-full max-w-lg rounded-[28px] bg-white p-8 text-center shadow-sm"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#ebf7f7] text-4xl text-[#0f8b8d]">✓</div><h1 className="mt-6 text-3xl font-black">پرداخت با موفقیت تأیید شد</h1><p className="mt-3 leading-8 text-[#676b6b]">دسترسی شما فعال شد و جزئیات خرید در داشبورد قابل مشاهده است.</p><Button href="/dashboard" className="mt-8">مشاهده خریدهای من</Button></div></main></>}
