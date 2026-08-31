"use client";

import { useState } from "react";
import { CustomSelect, type CustomSelectOption } from "@/components/custom-select";

export function AdminSelect({ name, options, defaultValue = "", ariaLabel, searchPlaceholder = "جست‌وجو…" }: { name: string; options: readonly CustomSelectOption[]; defaultValue?: string; ariaLabel: string; searchPlaceholder?: string }) {
  const [value, setValue] = useState(defaultValue);

  return <div className="admin-select-control">
    <CustomSelect
      className="admin-custom-select"
      options={options}
      value={value}
      onChange={setValue}
      placeholder="انتخاب کنید"
      searchPlaceholder={searchPlaceholder}
      ariaLabel={ariaLabel}
      searchable={false}
    />
    <input type="hidden" name={name} value={value} />
  </div>;
}
