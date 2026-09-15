"use client";

import { useState } from "react";
import { CustomSelect } from "@/components/custom-select";
import { countries } from "@/lib/countries";

const countryOptions = countries.map((label) => ({ value: label, label }));
const persianAndArabicCharacters = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;

export function AdminCountrySelect({ name, defaultValue = "", ariaLabel = "کشور" }: { name: string; defaultValue?: string; ariaLabel?: string }) {
  const [value, setValue] = useState(defaultValue);

  return <>
    <CustomSelect className="admin-custom-select" options={countryOptions} value={value} onChange={setValue} placeholder="کشور را انتخاب کنید" searchPlaceholder="جست‌وجوی کشور" ariaLabel={ariaLabel} />
    <input type="hidden" name={name} value={value} />
  </>;
}

export function AdminLatinPasswordInput({ name, minLength = 12, autoComplete = "new-password", required = false }: { name: string; minLength?: number; autoComplete?: string; required?: boolean }) {
  const [value, setValue] = useState("");
  return <input type="password" name={name} value={value} onChange={(event) => setValue(event.target.value.replace(persianAndArabicCharacters, ""))} minLength={minLength} autoComplete={autoComplete} required={required} />;
}
