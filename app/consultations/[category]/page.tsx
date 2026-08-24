import { products } from "@/lib/data";
import { ProductCard, SectionTitle } from "@/components/ui";
import { SiteFooter, SiteHeader } from "@/components/site-header";
export default async function CategoryPage({params}:{params:Promise<{category:string}>}){const {category}=await params;const title=category==="couples"?"زوج و رابطه":category==="teenagers"?"کودک و نوجوان":"مشاوره فردی";return <><SiteHeader/><main className="container-oz py-16"><SectionTitle eyebrow="حوزه مشاوره" title={title} description="با انتخاب یک خدمت، مسیر مناسب خودتان را شروع کنید."/><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{products.filter(p=>p.kind!=="course").map(p=><ProductCard key={p.id} product={p}/>)}</div></main><SiteFooter/></>}
