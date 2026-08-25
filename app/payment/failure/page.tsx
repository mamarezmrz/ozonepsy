import { Button } from "@/components/ui";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header-server";
import { createPageMetadata } from "@/lib/seo";
export const metadata: Metadata = createPageMetadata("پرداخت ناموفق");
export default function PaymentFailurePage(){return <><SiteHeader/><main className="container-oz flex min-h-[70vh] items-center justify-center py-16"><div className="w-full max-w-lg rounded-[28px] bg-white p-8 text-center shadow-sm"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff5f5] text-4xl text-[#db4244]">!</div><h1 className="mt-6 text-3xl font-black">پرداخت انجام نشد</h1><p className="mt-3 leading-8 text-[#676b6b]">مبلغی از حساب شما کسر نشده است. می‌توانید دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.</p><div className="mt-8 flex justify-center gap-3"><Button href="/pricing">تلاش دوباره</Button><Button href="/contact" variant="ghost">تماس با ما</Button></div></div></main></>}
