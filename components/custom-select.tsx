"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type CustomSelectOption = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  options: readonly CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  ariaLabel: string;
  invalid?: boolean;
};

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "جست‌وجو",
  ariaLabel,
  invalid = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value);
  const normalizedQuery = query.trim().toLocaleLowerCase("fa");
  const filteredOptions = normalizedQuery
    ? options.filter((option) => option.label.toLocaleLowerCase("fa").includes(normalizedQuery))
    : options;

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) window.requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  const choose = (option: CustomSelectOption) => {
    onChange(option.value);
    setOpen(false);
    setQuery("");
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div ref={rootRef} className="auth-custom-select">
      <button
        type="button"
        className={`auth-custom-select-trigger${invalid ? " is-invalid" : ""}`}
        aria-label={ariaLabel}
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        data-invalid={invalid || undefined}
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={selected ? "" : "is-placeholder"}>{selected?.label ?? placeholder}</span>
        <Image src="/icons/chevron-down.svg" alt="" width={16} height={16} className={open ? "is-open" : ""} />
      </button>

      {open && (
        <div className="auth-custom-select-menu">
          <div className="auth-custom-select-search-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              type="search"
              value={query}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div id={listboxId} className="auth-custom-select-options" role="listbox" aria-label={ariaLabel}>
            {filteredOptions.length > 0 ? filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`auth-custom-select-option${option.value === value ? " is-selected" : ""}`}
                onClick={() => choose(option)}
              >
                <span>{option.label}</span>
                {option.value === value && <span className="auth-custom-select-check" aria-hidden="true">✓</span>}
              </button>
            )) : <p className="auth-custom-select-empty">کشوری پیدا نشد.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
