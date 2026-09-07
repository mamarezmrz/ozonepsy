"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { CustomSelectOption } from "@/components/custom-select";

export function AdminMultiSelect({ options, values, onChange, placeholder, ariaLabel }: { options: readonly CustomSelectOption[]; values: string[]; onChange: (values: string[]) => void; placeholder: string; ariaLabel: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedOptions = options.filter((option) => values.includes(option.value));

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function toggle(value: string) {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  return <div ref={rootRef} className="auth-custom-select admin-custom-select admin-multi-select">
    <button type="button" className="auth-custom-select-trigger" aria-label={ariaLabel} aria-controls={listboxId} aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((current) => !current)}>
      <span className={selectedOptions.length ? "" : "is-placeholder"}>{selectedOptions.length ? selectedOptions.map((option) => option.label).join("، ") : placeholder}</span>
      <Image src="/icons/chevron-down.svg" alt="" width={16} height={16} className={open ? "is-open" : ""} />
    </button>
    {open ? <div className="auth-custom-select-menu admin-multi-select-menu"><div id={listboxId} className="auth-custom-select-options" role="listbox" aria-label={ariaLabel} aria-multiselectable="true">
      {options.map((option) => <button type="button" role="option" aria-selected={values.includes(option.value)} className={`auth-custom-select-option${values.includes(option.value) ? " is-selected" : ""}`} onClick={() => toggle(option.value)} key={option.value}><span>{option.label}</span><span className="admin-multi-select-checkbox" aria-hidden="true">{values.includes(option.value) ? "✓" : ""}</span></button>)}
    </div></div> : null}
  </div>;
}
