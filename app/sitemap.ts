import type { MetadataRoute } from "next";
export default function sitemap():MetadataRoute.Sitemap{return ["/","/consultations","/courses","/group-therapy","/therapists","/pricing","/about","/contact","/free-session"].map(path=>({url:`https://ozonepsy.example${path}`,lastModified:new Date()}))}
