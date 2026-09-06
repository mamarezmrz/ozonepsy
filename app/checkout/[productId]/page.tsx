import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/service";
import { getDemoCheckoutProduct } from "@/lib/demo-payment";
import { isDemoPaymentEnabled } from "@/lib/payments/demo-gate";
import { DemoCheckoutPage } from "@/components/demo-checkout-page";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ productId: string }> }): Promise<Metadata> {
  const { productId } = await params;
  const product = isDemoPaymentEnabled() ? await getDemoCheckoutProduct(productId) : null;
  return product ? createPageMetadata(`خرید ${product.title}`, "تکمیل سفارش و ادامه پرداخت امن در اُزون.") : createPageMetadata("تکمیل سفارش");
}

export default async function CheckoutPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  if (!isDemoPaymentEnabled()) notFound();
  const product = await getDemoCheckoutProduct(productId);
  if (!product) notFound();
  const user = await getCurrentUser();

  return <DemoCheckoutPage product={product} userEmail={user?.email ?? null} />;
}
