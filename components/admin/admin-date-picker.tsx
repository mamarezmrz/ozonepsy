"use client";

import { useEffect, useRef, useState } from "react";

type AdminDatePickerProps = {
  name: string;
  defaultValue?: string;
  ariaLabel: string;
  placeholder?: string;
  includeTime?: boolean;
  required?: boolean;
};

const weekDays = ["یک", "دو", "سه", "چهار", "پنج", "جمعه", "شنبه"];

function parseDateValue(value: string | undefined) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return new Date();
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function datePart(value: string) {
  return value.slice(0, 10);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDate(value: string, time: string, includeTime: boolean) {
  if (!value) return "";
  const date = parseDateValue(value);
  const formatted = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", { day: "numeric", month: "long", year: "numeric" }).format(date);
  return includeTime && time ? `${formatted}، ${time}` : formatted;
}

export function AdminDatePicker({ name, defaultValue = "", ariaLabel, placeholder = "انتخاب تاریخ", includeTime = false, required = false }: AdminDatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const initialDate = parseDateValue(defaultValue);
  const [value, setValue] = useState(defaultValue);
  const [time, setTime] = useState(defaultValue.slice(11, 16) || "09:00");
  const [viewDate, setViewDate] = useState(initialDate);
  const [open, setOpen] = useState(false);

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

  const selectedDate = datePart(value);
  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const calendarCells = [...Array.from({ length: firstDay }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const monthLabel = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", { month: "long", year: "numeric" }).format(viewDate);

  function chooseDate(day: number) {
    const nextValue = formatDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    setValue(includeTime ? `${nextValue}T${time}` : nextValue);
    if (!includeTime) setOpen(false);
  }

  function chooseTime(nextTime: string) {
    setTime(nextTime);
    if (selectedDate) setValue(`${selectedDate}T${nextTime}`);
  }

  function clear() {
    setValue("");
    setTime("09:00");
    setOpen(false);
  }

  return <div ref={rootRef} className="admin-date-picker">
    <button type="button" className="admin-date-trigger" aria-label={ariaLabel} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((current) => !current)}>
      <span className={value ? "" : "is-placeholder"}>{displayDate(value, time, includeTime) || placeholder}</span>
      <svg className="admin-date-trigger-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" /><path d="M7 2.5v4M17 2.5v4M3 9.5h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
    </button>
    <input type="hidden" name={name} value={value} required={required} />
    {open ? <div className="admin-date-popover" role="dialog" aria-label={ariaLabel}>
      <div className="admin-date-header">
        <button type="button" aria-label="ماه بعد" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>‹</button>
        <strong>{monthLabel}</strong>
        <button type="button" aria-label="ماه قبل" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>›</button>
      </div>
      <div className="admin-date-weekdays" aria-hidden="true">{weekDays.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="admin-date-grid">{calendarCells.map((day, index) => day ? <button key={day} type="button" className={selectedDate === formatDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)) ? "is-selected" : ""} aria-label={`${day} ${monthLabel}`} aria-current={selectedDate === formatDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day)) ? "date" : undefined} onClick={() => chooseDate(day)}>{day.toLocaleString("fa-IR")}</button> : <span key={`empty-${index}`} aria-hidden="true" />)}</div>
      {includeTime ? <div className="admin-date-time-row"><span>ساعت</span><input className="admin-date-time" type="time" value={time} onChange={(event) => chooseTime(event.target.value)} /></div> : null}
      {value ? <button type="button" className="admin-date-clear" onClick={clear}>پاک کردن</button> : null}
    </div> : null}
  </div>;
}
