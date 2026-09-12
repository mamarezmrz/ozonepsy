"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "./ui";
export function AuthForm({mode="login"}:{mode?:"login"|"signup"}){
  const [isSubmitting,setIsSubmitting]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  async function handleSubmit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");
    try{
      const response=await fetch(`/api/auth/${mode}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries()))});
      const result=await response.json() as {message?:string;error?:string};
      if(!response.ok){setError(result.error??"اطلاعات واردشده را بررسی کنید.");return;}
      setMessage(result.message??(mode==="login"?"ورود شما با موفقیت انجام شد.":"ثبت‌نام شما با موفقیت انجام شد."));
    }catch{setError("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");}
    finally{setIsSubmitting(false);}
  }

  return <form noValidate onSubmit={handleSubmit} className="grid gap-4">{mode==="signup"&&<input required name="displayName" aria-label="نام" placeholder="نام و نام خانوادگی" className="focus-ring rounded-xl border border-[#d8e5e5] px-4 py-3"/>}<input required name="email" type="email" aria-label="ایمیل" placeholder="آدرس ایمیل" className="focus-ring rounded-xl border border-[#d8e5e5] px-4 py-3"/><input required name="password" type="password" aria-label="رمز عبور" placeholder="رمز عبور" className="focus-ring rounded-xl border border-[#d8e5e5] px-4 py-3"/>{mode==="login"&&<Link href="/forgot-password" className="justify-self-start text-sm font-bold text-[#0f8b8d] hover:underline">فراموشی رمز ورود</Link>}{error&&<div role="alert" className="rounded-xl bg-[#fff5f5] p-4 text-sm text-[#db4244]">{error}</div>}{message?<div role="status" className="rounded-xl bg-[#ebf7f7] p-4 text-sm font-bold text-[#355859]">{message}</div>:<Button type="submit" disabled={isSubmitting}>{isSubmitting?"لطفاً صبر کنید":mode==="login"?"ورود به حساب":"ساخت حساب"}</Button>}</form>}
export function SessionAction(){const [done,setDone]=useState(false);return done?<span className="rounded-full bg-[#ebf7f7] px-3 py-1 text-sm font-bold text-[#0f8b8d]">ثبت شد</span>:<button onClick={()=>setDone(true)} className="focus-ring rounded-xl bg-[#eba983] px-4 py-2 text-sm font-bold">ثبت جلسه</button>}
