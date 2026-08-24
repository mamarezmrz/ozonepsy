import { formatPersianNumber } from "@/lib/format";

export type ProductKind = "consultation" | "package" | "group" | "course";
export type Product = { id:string; slug:string; title:string; kind:ProductKind; category:string; description:string; price:number; sessions?:number; duration?:string; accent:string; label:string; featured?:boolean };
export const products: Product[] = [
 {id:"individual-1",slug:"individual-consultation",title:"مشاوره فردی آنلاین",kind:"consultation",category:"مشاوره فردی",description:"یک جلسه امن و محرمانه با مشاور مورد اعتماد شما.",price:79,duration:"۵۰ دقیقه",accent:"from-[#355859] to-[#73bebf]",label:"پیشنهاد اُزون",featured:true},
 {id:"package-6",slug:"six-session-package",title:"بسته ۶ جلسه‌ای مشاوره",kind:"package",category:"مشاوره فردی",description:"برای ساختن یک مسیر منظم و پیوسته در کنار مشاور.",price:399,sessions:6,duration:"۶ × ۵۰ دقیقه",accent:"from-[#cc6f39] to-[#eba983]",label:"به‌صرفه‌تر",featured:true},
 {id:"group-therapy",slug:"group-therapy",title:"گروه‌درمانی آنلاین",kind:"group",category:"گروه درمانی",description:"جلسات هفتگی با موضوعات متنوع، همراه با یک روانشناس.",price:129,sessions:4,duration:"۴ جلسه هفتگی",accent:"from-[#0f8b8d] to-[#d8e5e5]",label:"گروه جدید"},
 {id:"life-skills",slug:"life-skills-course",title:"دوره مهارت‌های زندگی",kind:"course",category:"دوره‌های روانشناسی",description:"تکنیک‌های کاربردی برای مدیریت احساسات و روابط.",price:179,duration:"دسترسی مادام‌العمر",accent:"from-[#b3683e] to-[#f5dccf]",label:"دوره ضبط‌شده",featured:true},
];
export const categories=[{title:"مشاوره فردی",text:"برای شناخت بهتر خود و عبور از چالش‌ها",href:"/consultations/individual",tone:"bg-[#fdf4f0]"},{title:"زوج و رابطه",text:"برای رابطه‌ای امن‌تر و آگاهانه‌تر",href:"/consultations/couples",tone:"bg-[#ebf7f7]"},{title:"کودک و نوجوان",text:"همراهی تخصصی برای سال‌های مهم رشد",href:"/consultations/teenagers",tone:"bg-[#f5dccf]"},{title:"گروه درمانی",text:"تجربه رشد در کنار آدم‌های هم‌مسیر",href:"/group-therapy",tone:"bg-[#e4f0f0]"}];
export const testimonials=[{name:"نرگس",text:"در هر جلسه احساس می‌کنم که یک قدم جلوتر رفته‌ام و اعتماد به نفسم بیشتر شده است."},{name:"میلاد",text:"پیدا کردن مشاور مناسب برای من ساده و قابل اعتماد بود. از تجربه‌ام راضی‌ام."},{name:"لیلا",text:"فضای امن جلسات کمک کرد با آرامش بیشتری درباره چیزهایی که برایم مهم است صحبت کنم."}];
export const formatPrice=(price:number)=>`$${formatPersianNumber(price)}`;
