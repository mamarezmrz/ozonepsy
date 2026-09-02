import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/admin", "/admin/", "/api/admin/", "/checkout/", "/payment/"] }, sitemap: `${getPublicSiteUrl()}/sitemap.xml` }; }
